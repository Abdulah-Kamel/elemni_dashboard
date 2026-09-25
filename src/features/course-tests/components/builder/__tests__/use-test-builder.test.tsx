import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { makeFakeClient, makeQuestion, makeTest } from "./fake-client"
import { useTestBuilder } from "../use-test-builder"

let fake = makeFakeClient(makeTest())

vi.mock("../../../client", () => ({
  COURSE_TESTS_CHANGED: "elemni:course-tests-changed",
  getCourseTestsClient: () => Promise.resolve(fake),
}))

const labels = { trueLabel: "صح", falseLabel: "خطأ" }

async function setup(test = makeTest({ questions: [makeQuestion(1), makeQuestion(2)] })) {
  fake = makeFakeClient(test)
  const hook = renderHook(() => useTestBuilder(test.id, labels))
  await waitFor(() => expect(hook.result.current.loadState.status).toBe("ready"))
  return hook
}

describe("useTestBuilder autosave", () => {
  it("saves only the question that changed, once, after the debounce", async () => {
    const { result } = await setup()
    act(() => {
      result.current.updateQuestion(1, (question) => ({ ...question, text: "نص جديد" }))
      result.current.updateQuestion(1, (question) => ({ ...question, text: "نص أحدث" }))
    })
    expect(result.current.saveState).toBe("pending")
    expect(fake.updateQuestion).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.saveState).toBe("saved"), { timeout: 2000 })
    expect(fake.updateQuestion).toHaveBeenCalledTimes(1)
    expect(fake.updateQuestion).toHaveBeenCalledWith(1, expect.objectContaining({ text: "نص أحدث" }))
    expect(fake.updateSettings).not.toHaveBeenCalled()
    expect(fake.reorderQuestions).not.toHaveBeenCalled()
  })

  it("keeps a new question local until it has text, then creates it with صح / خطأ", async () => {
    const { result } = await setup()
    let tempId = 0
    act(() => {
      tempId = result.current.addQuestion("true_false")
    })
    expect(tempId).toBeLessThan(0)
    await waitFor(() => expect(result.current.saveState).toBe("incomplete"), { timeout: 2000 })
    expect(fake.addQuestion).not.toHaveBeenCalled()

    act(() => result.current.updateQuestion(tempId, (question) => ({ ...question, text: "القوائم قابلة للتعديل" })))
    await waitFor(() => expect(fake.addQuestion).toHaveBeenCalledTimes(1), { timeout: 2000 })
    expect(fake.addQuestion.mock.calls[0][1].options.map((option: { text: string }) => option.text)).toEqual(["صح", "خطأ"])
    await waitFor(() => expect(result.current.saveState).toBe("saved"), { timeout: 2000 })
    expect(result.current.questions.at(-1)!.id).toBeGreaterThan(0)
    // the editor key stays stable so focus survives the id swap
    expect(result.current.questions.at(-1)!.local_key).toBe(tempId)
    expect(result.current.selectedId).toBe(result.current.questions.at(-1)!.id)
  })

  it("sends only the settings fields that changed and are valid", async () => {
    const { result } = await setup()
    act(() => result.current.updateSettings({ pass_percent: 70, random_pool_size: 9 }))
    await waitFor(() => expect(fake.updateSettings).toHaveBeenCalledTimes(1), { timeout: 2000 })
    expect(fake.updateSettings).toHaveBeenCalledWith(5, { pass_percent: 70 })
    await waitFor(() => expect(result.current.saveState).toBe("incomplete"))
  })

  it("reorders with a single call", async () => {
    const { result } = await setup()
    act(() => result.current.moveQuestion(0, 1))
    await waitFor(() => expect(fake.reorderQuestions).toHaveBeenCalledWith(5, [2, 1]), { timeout: 2000 })
    expect(fake.updateQuestion).not.toHaveBeenCalled()
  })

  it("reports save failures and retries", async () => {
    const { result } = await setup()
    fake.updateQuestion.mockResolvedValueOnce({ ok: false, error: "انقطع الاتصال" } as never)
    act(() => result.current.updateQuestion(2, (question) => ({ ...question, points: 3 })))
    await waitFor(() => expect(result.current.saveState).toBe("error"), { timeout: 2000 })
    expect(result.current.saveError).toBe("انقطع الاتصال")
    await act(async () => {
      await result.current.flush()
    })
    expect(result.current.saveState).toBe("saved")
    expect(fake.updateQuestion).toHaveBeenCalledTimes(2)
  })
})

describe("published test with attempts", () => {
  const published = () => makeTest({ status: "published", attempt_count: 4, questions: [makeQuestion(1)] })

  it("asks once before the first save, then saves", async () => {
    const { result } = await setup(published())
    expect(result.current.needsAck).toBe(true)
    act(() => result.current.updateSettings({ pass_percent: 80 }))
    await waitFor(() => expect(result.current.ackOpen).toBe(true), { timeout: 2000 })
    expect(fake.updateSettings).not.toHaveBeenCalled()
    act(() => result.current.resolveAck(true))
    await waitFor(() => expect(fake.updateSettings).toHaveBeenCalledWith(5, { pass_percent: 80 }))

    act(() => result.current.updateSettings({ pass_percent: 90 }))
    await waitFor(() => expect(fake.updateSettings).toHaveBeenCalledTimes(2), { timeout: 2000 })
    expect(result.current.ackOpen).toBe(false)
  })

  it("discards local edits when the teacher backs out", async () => {
    const { result } = await setup(published())
    act(() => result.current.updateSettings({ pass_percent: 80 }))
    await waitFor(() => expect(result.current.ackOpen).toBe(true), { timeout: 2000 })
    act(() => result.current.resolveAck(false))
    await waitFor(() => expect(result.current.settings!.pass_percent).toBe(60))
    expect(fake.updateSettings).not.toHaveBeenCalled()
    expect(fake.getTest).toHaveBeenCalledTimes(2)
  })
})

describe("publish", () => {
  it("surfaces server issues when publishing fails", async () => {
    const { result } = await setup()
    fake.publishTest.mockResolvedValueOnce({ ok: false, error: "لا يمكن النشر", issues: [{ code: "missing_answer_key", message: "السؤال 2: لم تُحدَّد الإجابة الصحيحة", question_id: 2 }] })
    let outcome: Awaited<ReturnType<typeof result.current.publish>> | undefined
    await act(async () => {
      outcome = await result.current.publish()
    })
    expect(outcome).toMatchObject({ ok: false, error: "لا يمكن النشر" })
    expect(result.current.serverIssues).toHaveLength(1)
  })

  it("updates the status after a successful publish", async () => {
    const { result } = await setup()
    await act(async () => {
      await result.current.publish()
    })
    expect(result.current.test!.status).toBe("published")
  })
})
