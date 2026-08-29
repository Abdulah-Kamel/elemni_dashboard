"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { CourseBuilderNode } from "@/features/student-preview/types"

export type CourseBuilderField = "title" | "description" | "price"

type CourseBuilderBridgeValue = {
  enabled: boolean
  selectedNode: CourseBuilderNode | null
  hoveredNode: CourseBuilderNode | null
  selectedField: CourseBuilderField | null
  hoveredField: CourseBuilderField | null
  setHoveredNode: (node: CourseBuilderNode | null) => void
  setHoveredField: (field: CourseBuilderField | null) => void
  highlightNode: (node: CourseBuilderNode) => void
  clearSelectedNode: (node: CourseBuilderNode) => void
  highlightField: (field: CourseBuilderField) => void
  clearSelectedField: (field: CourseBuilderField) => void
  selectNode: (node: CourseBuilderNode) => void
  selectField: (field: CourseBuilderField) => void
  notifyCurriculumCommitted: () => void | Promise<void>
}

const noop = () => undefined

const fallbackBridge: CourseBuilderBridgeValue = {
  enabled: false,
  selectedNode: null,
  hoveredNode: null,
  selectedField: null,
  hoveredField: null,
  setHoveredNode: noop,
  setHoveredField: noop,
  highlightNode: noop,
  clearSelectedNode: noop,
  highlightField: noop,
  clearSelectedField: noop,
  selectNode: noop,
  selectField: noop,
  notifyCurriculumCommitted: noop,
}

const CourseBuilderBridgeContext =
  createContext<CourseBuilderBridgeValue>(fallbackBridge)

export function CourseBuilderBridgeProvider({
  children,
  onCurriculumCommitted,
  onSelectTarget,
  enabled = true,
}: {
  children: ReactNode
  onCurriculumCommitted?: () => void | Promise<void>
  onSelectTarget?: () => void
  enabled?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<CourseBuilderNode | null>(
    null
  )
  const [hoveredNode, setHoveredNodeState] = useState<CourseBuilderNode | null>(
    null
  )
  const [selectedField, setSelectedField] = useState<CourseBuilderField | null>(
    null
  )
  const [hoveredField, setHoveredFieldState] =
    useState<CourseBuilderField | null>(null)

  const setHoveredNode = useCallback(
    (node: CourseBuilderNode | null) => {
      if (enabled) setHoveredNodeState(node)
    },
    [enabled]
  )

  const setHoveredField = useCallback(
    (field: CourseBuilderField | null) => {
      if (enabled) setHoveredFieldState(field)
    },
    [enabled]
  )

  const highlightNode = useCallback(
    (node: CourseBuilderNode) => {
      if (!enabled) return
      setSelectedNode(node)
      setSelectedField(null)
    },
    [enabled]
  )

  const clearSelectedNode = useCallback((node: CourseBuilderNode) => {
    setSelectedNode((current) =>
      current?.type === node.type && String(current.id) === String(node.id)
        ? null
        : current
    )
  }, [])

  const highlightField = useCallback(
    (field: CourseBuilderField) => {
      if (!enabled) return
      setSelectedField(field)
      setSelectedNode(null)
    },
    [enabled]
  )

  const clearSelectedField = useCallback((field: CourseBuilderField) => {
    setSelectedField((current) => (current === field ? null : current))
  }, [])

  const getRoot = useCallback(() => rootRef.current, [])

  const focusEditorField = useCallback(
    (field: CourseBuilderField) => {
      const root = getRoot()
      const target = root?.querySelector<HTMLElement>(
        `[data-builder-field-input="${field}"]`
      )
      if (!target) return

      if (target !== document.activeElement) {
        target.focus({ preventScroll: true })
      }

      const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      )?.matches
      target.scrollIntoView?.({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
      })
    },
    [getRoot]
  )

  const focusEditorNode = useCallback(
    (node: CourseBuilderNode) => {
      const root = getRoot()
      if (!root) return

      const target = Array.from(
        root.querySelectorAll<HTMLElement>("[data-builder-node-type]")
      ).find(
        (element) =>
          element.dataset.builderNodeType === node.type &&
          element.dataset.builderNodeId === String(node.id)
      )
      if (!target) return

      if (target !== document.activeElement) {
        target.focus({ preventScroll: true })
      }

      const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      )?.matches
      target.scrollIntoView?.({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
      })
    },
    [getRoot]
  )

  const selectNode = useCallback(
    (node: CourseBuilderNode) => {
      if (!enabled) return
      setSelectedNode(node)
      setSelectedField(null)
      onSelectTarget?.()

      // Keep the editor selection visible when a preview element is chosen.
      // The curriculum components expose stable data attributes instead of
      // coupling the preview to their internal implementation.
      const schedule =
        typeof window.requestAnimationFrame === "function"
          ? window.requestAnimationFrame.bind(window)
          : (callback: FrameRequestCallback) => window.setTimeout(callback, 0)

      focusEditorNode(node)

      if (onSelectTarget) {
        schedule(() => focusEditorNode(node))
      }
    },
    [enabled, focusEditorNode, onSelectTarget]
  )

  const selectField = useCallback(
    (field: CourseBuilderField) => {
      if (!enabled) return
      setSelectedField(field)
      setSelectedNode(null)
      onSelectTarget?.()
      focusEditorField(field)

      if (
        onSelectTarget &&
        typeof window.requestAnimationFrame === "function"
      ) {
        window.requestAnimationFrame(() => focusEditorField(field))
      }
    },
    [enabled, focusEditorField, onSelectTarget]
  )

  const value = useMemo<CourseBuilderBridgeValue>(
    () => ({
      enabled,
      selectedNode,
      hoveredNode,
      selectedField,
      hoveredField,
      setHoveredNode,
      setHoveredField,
      highlightNode,
      clearSelectedNode,
      highlightField,
      clearSelectedField,
      selectNode,
      selectField,
      notifyCurriculumCommitted: onCurriculumCommitted ?? noop,
    }),
    [
      clearSelectedField,
      clearSelectedNode,
      enabled,
      highlightField,
      highlightNode,
      hoveredField,
      hoveredNode,
      onCurriculumCommitted,
      selectField,
      selectNode,
      selectedField,
      selectedNode,
      setHoveredField,
      setHoveredNode,
    ]
  )

  return (
    <CourseBuilderBridgeContext.Provider value={value}>
      <div ref={rootRef} data-course-builder-bridge-root className="contents">
        {children}
      </div>
    </CourseBuilderBridgeContext.Provider>
  )
}

export function useCourseBuilderBridge() {
  return useContext(CourseBuilderBridgeContext)
}
