"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { DragOverlay } from "@dnd-kit/core"

/**
 * Keeps dnd-kit's fixed drag preview anchored to the viewport.
 *
 * The course builder is wrapped in an entrance animation. That animation
 * leaves a transform-containing block behind, which would otherwise make a
 * fixed DragOverlay position itself relative to the workspace and jump to
 * its top while dragging.
 */
export function PortalDragOverlay({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    noopSubscribe,
    getClientSnapshot,
    getServerSnapshot
  )

  const overlay = <DragOverlay>{children}</DragOverlay>

  // Preserve the server/client first render, then portal after the body is
  // available. React portals retain the surrounding DndContext value.
  return mounted ? createPortal(overlay, document.body) : overlay
}

function noopSubscribe() {
  return () => undefined
}

function getClientSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}
