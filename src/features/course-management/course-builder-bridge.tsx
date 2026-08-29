"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { CourseBuilderNode } from "@/features/student-preview/types"

type CourseBuilderBridgeValue = {
  selectedNode: CourseBuilderNode | null
  selectNode: (node: CourseBuilderNode) => void
  notifyCurriculumCommitted: () => void | Promise<void>
}

const noop = () => undefined

const fallbackBridge: CourseBuilderBridgeValue = {
  selectedNode: null,
  selectNode: noop,
  notifyCurriculumCommitted: noop,
}

const CourseBuilderBridgeContext =
  createContext<CourseBuilderBridgeValue>(fallbackBridge)

export function CourseBuilderBridgeProvider({
  children,
  onCurriculumCommitted,
}: {
  children: ReactNode
  onCurriculumCommitted?: () => void | Promise<void>
}) {
  const [selectedNode, setSelectedNode] = useState<CourseBuilderNode | null>(
    null
  )

  const selectNode = useCallback((node: CourseBuilderNode) => {
    setSelectedNode(node)

    // Keep the editor selection visible when a preview element is chosen.
    // The curriculum components expose stable data attributes instead of
    // coupling the preview to their internal implementation.
    const schedule =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) => window.setTimeout(callback, 0)

    schedule(() => {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>("[data-builder-node-type]")
      ).find(
        (element) =>
          element.dataset.builderNodeType === node.type &&
          element.dataset.builderNodeId === String(node.id)
      )

      target?.scrollIntoView?.({ block: "nearest", behavior: "smooth" })
    })
  }, [])

  const value = useMemo<CourseBuilderBridgeValue>(
    () => ({
      selectedNode,
      selectNode,
      notifyCurriculumCommitted: onCurriculumCommitted ?? noop,
    }),
    [onCurriculumCommitted, selectNode, selectedNode]
  )

  return (
    <CourseBuilderBridgeContext.Provider value={value}>
      {children}
    </CourseBuilderBridgeContext.Provider>
  )
}

export function useCourseBuilderBridge() {
  return useContext(CourseBuilderBridgeContext)
}
