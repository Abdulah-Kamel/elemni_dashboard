"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { COURSE_TESTS_CHANGED, getCourseTestsClient } from "../../client"
import type { CourseTest, PublishIssue, QuestionType, TestQuestion, TestSettings } from "../../types"
import {
  isPersistable,
  moveItem,
  newQuestion,
  pickSettings,
  splitSettingsPatch,
  toQuestionInput,
  type DraftQuestion,
  type SettingsField,
  type TypeLabels,
} from "./builder-model"

export type SaveState = "saved" | "pending" | "saving" | "incomplete" | "error"

type Model = { test: CourseTest; settings: TestSettings; questions: DraftQuestion[] }

export const AUTOSAVE_DELAY_MS = 800

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(COURSE_TESTS_CHANGED))
}

function modelFrom(test: CourseTest): Model {
  const questions = [...test.questions].sort((a, b) => a.position - b.position)
  return { test, settings: pickSettings(test), questions }
}

/**
 * Local-first builder state. Edits apply immediately; only the questions and
 * settings fields that changed are sent, debounced. Questions the API would
 * reject (no text / bad points) and settings that fail validation are held
 * locally until they become valid ("incomplete").
 */
export function useTestBuilder(testId: number, labels: TypeLabels) {
  const [loadState, setLoadState] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready" }>({ status: "loading" })
  const [model, setModelState] = useState<Model | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [saveState, setSaveState] = useState<SaveState>("saved")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [ackOpen, setAckOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [serverIssues, setServerIssues] = useState<PublishIssue[]>([])

  const modelRef = useRef<Model | null>(null)
  const dirtyQuestions = useRef(new Set<number>())
  const dirtySettings = useRef(new Set<SettingsField>())
  const orderDirty = useRef(false)
  const tempId = useRef(-1)
  const acknowledged = useRef(false)
  const ackResolver = useRef<((value: boolean) => void) | null>(null)
  const ackPromise = useRef<Promise<boolean> | null>(null)
  const inflight = useRef<Promise<boolean> | null>(null)
  const rerun = useRef(false)

  const setModel = useCallback((update: (current: Model) => Model) => {
    if (!modelRef.current) return
    const next = update(modelRef.current)
    modelRef.current = next
    setModelState(next)
  }, [])

  const hasDirty = () => dirtyQuestions.current.size > 0 || dirtySettings.current.size > 0 || orderDirty.current

  const markDirty = useCallback(() => {
    setSaveState("pending")
    setVersion((value) => value + 1)
  }, [])

  const load = useCallback(async () => {
    const client = await getCourseTestsClient()
    const result = await client.getTest(testId)
    if (!result.ok) {
      setLoadState({ status: "error", message: result.error })
      return
    }
    const next = modelFrom(result.data)
    modelRef.current = next
    dirtyQuestions.current.clear()
    dirtySettings.current.clear()
    orderDirty.current = false
    setModelState(next)
    setSelectedId((current) => (current !== null && next.questions.some((question) => question.id === current) ? current : next.questions[0]?.id ?? null))
    setSaveState("saved")
    setSaveError(null)
    setLoadState({ status: "ready" })
  }, [testId])

  useEffect(() => {
    // Initial fetch through the course-tests client; state is set after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const needsAck = Boolean(model && model.test.status === "published" && model.test.attempt_count > 0)

  /** Resolves true once the teacher accepted that edits only affect new attempts. */
  const ensureAck = useCallback((): Promise<boolean> => {
    const current = modelRef.current
    if (!current || acknowledged.current || !(current.test.status === "published" && current.test.attempt_count > 0)) return Promise.resolve(true)
    ackPromise.current ??= new Promise<boolean>((resolve) => {
      ackResolver.current = resolve
      setAckOpen(true)
    })
    return ackPromise.current
  }, [])

  const resolveAck = useCallback((accepted: boolean) => {
    if (accepted) acknowledged.current = true
    setAckOpen(false)
    ackResolver.current?.(accepted)
    ackResolver.current = null
    ackPromise.current = null
  }, [])

  const flushOnce = useCallback(async (): Promise<boolean> => {
    if (!modelRef.current || !hasDirty()) {
      setSaveState("saved")
      return true
    }
    if (!(await ensureAck())) {
      // Declined: drop local edits and go back to what students see.
      await load()
      return false
    }
    setSaveState("saving")
    setSaveError(null)
    const client = await getCourseTestsClient()
    let changed = false
    try {
      // Settings — only the fields that changed and are currently valid.
      if (dirtySettings.current.size > 0) {
        const current = modelRef.current!
        const patch = Object.fromEntries([...dirtySettings.current].map((field) => [field, current.settings[field]])) as Partial<TestSettings>
        const { send } = splitSettingsPatch(patch, current.settings, current.questions.length)
        const fields = Object.keys(send) as SettingsField[]
        if (fields.length > 0) {
          fields.forEach((field) => dirtySettings.current.delete(field))
          const result = await client.updateSettings(testId, send)
          if (!result.ok) {
            fields.forEach((field) => dirtySettings.current.add(field))
            throw new Error(result.error)
          }
          changed = true
          setModel((model) => ({ ...model, test: { ...model.test, status: result.data.status, attempt_count: result.data.attempt_count, updated_at: result.data.updated_at } }))
        }
      }

      // Questions — create local drafts, update edited ones.
      for (const question of [...modelRef.current!.questions]) {
        if (!dirtyQuestions.current.has(question.id)) continue
        const latest = modelRef.current!.questions.find((item) => item.id === question.id)
        if (!latest || !isPersistable(latest)) continue
        const position = modelRef.current!.questions.indexOf(latest)
        dirtyQuestions.current.delete(latest.id)
        if (latest.id < 0) {
          const result = await client.addQuestion(testId, toQuestionInput(latest, position))
          if (!result.ok) {
            dirtyQuestions.current.add(latest.id)
            throw new Error(result.error)
          }
          const realId = result.data.id
          setModel((model) => ({
            ...model,
            questions: model.questions.map((item) => (item.id === latest.id ? { ...item, id: realId, bank_question_id: result.data.bank_question_id } : item)),
          }))
          if (dirtyQuestions.current.delete(latest.id)) dirtyQuestions.current.add(realId)
          setSelectedId((current) => (current === latest.id ? realId : current))
          orderDirty.current = true
        } else {
          const result = await client.updateQuestion(latest.id, toQuestionInput(latest, position))
          if (!result.ok) {
            dirtyQuestions.current.add(latest.id)
            throw new Error(result.error)
          }
          setModel((model) => ({
            ...model,
            questions: model.questions.map((item) => (item.id === latest.id ? { ...item, bank_question_id: result.data.bank_question_id ?? item.bank_question_id } : item)),
          }))
        }
        changed = true
      }

      if (orderDirty.current) {
        const ids = modelRef.current!.questions.filter((question) => question.id > 0).map((question) => question.id)
        orderDirty.current = false
        if (ids.length > 0) {
          const result = await client.reorderQuestions(testId, ids)
          if (!result.ok) {
            orderDirty.current = true
            throw new Error(result.error)
          }
          changed = true
        }
      }
      if (changed) notifyChanged()
      setSaveState(hasDirty() ? "incomplete" : "saved")
      return true
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : null)
      setSaveState("error")
      return false
    }
  }, [ensureAck, load, setModel, testId])

  const flush = useCallback((): Promise<boolean> => {
    if (inflight.current) {
      rerun.current = true
      return inflight.current
    }
    const run = (async () => {
      let ok = true
      do {
        rerun.current = false
        ok = await flushOnce()
      } while (ok && rerun.current)
      return ok
    })()
    inflight.current = run.finally(() => {
      inflight.current = null
    })
    return inflight.current
  }, [flushOnce])

  // Debounced autosave of whatever is dirty.
  useEffect(() => {
    if (version === 0) return
    const timer = window.setTimeout(() => void flush(), AUTOSAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [version, flush])

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasDirty()) return
      event.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [])

  // ---------------------------------------------------------------------------
  // Local edits

  const updateQuestion = useCallback(
    (id: number, update: (question: DraftQuestion) => DraftQuestion) => {
      setModel((model) => ({ ...model, questions: model.questions.map((question) => (question.id === id ? update(question) : question)) }))
      dirtyQuestions.current.add(id)
      markDirty()
    },
    [markDirty, setModel],
  )

  const updateSettings = useCallback(
    (patch: Partial<TestSettings>) => {
      setModel((model) => ({ ...model, settings: { ...model.settings, ...patch } }))
      ;(Object.keys(patch) as SettingsField[]).forEach((field) => dirtySettings.current.add(field))
      markDirty()
    },
    [markDirty, setModel],
  )

  const addQuestion = useCallback(
    (type: QuestionType) => {
      const id = tempId.current--
      setModel((model) => ({ ...model, questions: [...model.questions, { ...newQuestion(type, model.questions.length, id, labels), local_key: id }] }))
      dirtyQuestions.current.add(id)
      setSelectedId(id)
      markDirty()
      return id
    },
    [labels, markDirty, setModel],
  )

  const duplicateQuestion = useCallback(
    (id: number) => {
      const copyId = tempId.current--
      setModel((model) => {
        const index = model.questions.findIndex((question) => question.id === id)
        if (index === -1) return model
        const source = model.questions[index]
        const copy: DraftQuestion = { ...structuredClone(source), id: copyId, local_key: copyId, bank_question_id: null, save_to_bank: false }
        const questions = [...model.questions]
        questions.splice(index + 1, 0, copy)
        return { ...model, questions }
      })
      dirtyQuestions.current.add(copyId)
      orderDirty.current = true
      setSelectedId(copyId)
      markDirty()
    },
    [markDirty, setModel],
  )

  const moveQuestion = useCallback(
    (from: number, to: number) => {
      setModel((model) => ({ ...model, questions: moveItem(model.questions, from, to) }))
      orderDirty.current = true
      markDirty()
    },
    [markDirty, setModel],
  )

  const deleteQuestion = useCallback(
    async (id: number): Promise<{ ok: boolean; error?: string }> => {
      if (id > 0) {
        if (!(await ensureAck())) return { ok: false }
        const client = await getCourseTestsClient()
        const result = await client.deleteQuestion(id)
        if (!result.ok) return { ok: false, error: result.error }
        notifyChanged()
      }
      let nextSelected: number | null = null
      setModel((model) => {
        const index = model.questions.findIndex((question) => question.id === id)
        const questions = model.questions.filter((question) => question.id !== id)
        nextSelected = questions[Math.min(index, questions.length - 1)]?.id ?? null
        const settings = model.settings.random_pool_size !== null && model.settings.random_pool_size > questions.length ? { ...model.settings, random_pool_size: questions.length || null } : model.settings
        return { ...model, questions, settings }
      })
      dirtyQuestions.current.delete(id)
      setSelectedId((current) => (current === id ? nextSelected : current))
      if (!hasDirty()) setSaveState("saved")
      return { ok: true }
    },
    [ensureAck, setModel],
  )

  /** Append questions the server already created (bank / Excel import). */
  const appendPersisted = useCallback(
    (questions: TestQuestion[]) => {
      if (questions.length === 0) return
      setModel((model) => ({ ...model, questions: [...model.questions, ...questions] }))
      setSelectedId(questions[0].id)
      notifyChanged()
    },
    [setModel],
  )

  const publish = useCallback(async (): Promise<{ ok: true } | { ok: false; error: string | null; issues: PublishIssue[] }> => {
    setPublishing(true)
    setServerIssues([])
    try {
      const saved = await flush()
      if (!saved || hasDirty()) return { ok: false, error: null, issues: [] }
      const client = await getCourseTestsClient()
      const result = await client.publishTest(testId)
      if (!result.ok) {
        setServerIssues(result.issues ?? [])
        return { ok: false, error: result.error, issues: result.issues ?? [] }
      }
      const next = modelFrom(result.data)
      modelRef.current = next
      setModelState(next)
      notifyChanged()
      return { ok: true }
    } finally {
      setPublishing(false)
    }
  }, [flush, testId])

  return {
    loadState,
    reload: load,
    test: model?.test ?? null,
    settings: model?.settings ?? null,
    questions: model?.questions ?? [],
    selectedId,
    setSelectedId,
    saveState,
    saveError,
    flush,
    needsAck,
    ackOpen,
    resolveAck,
    ensureAck,
    updateQuestion,
    updateSettings,
    addQuestion,
    duplicateQuestion,
    moveQuestion,
    deleteQuestion,
    appendPersisted,
    publish,
    publishing,
    serverIssues,
  }
}

export type TestBuilderState = ReturnType<typeof useTestBuilder>
