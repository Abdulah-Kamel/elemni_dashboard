"use client"

import type { ReactNode } from "react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

function Row({ id, children, handleLabel }: { id: string; handleLabel: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={handleLabel}
      className="grid h-11 w-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-on-surface-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  )
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("relative", isDragging && "z-10 opacity-70")}>
      {children(handle)}
    </li>
  )
}

/** Vertical list reorderable by pointer drag and keyboard (space + arrows on the handle). */
export function SortableRows<T extends { id: string }>({
  items,
  onMove,
  handleLabel,
  children,
  className,
}: {
  items: readonly T[]
  onMove: (from: number, to: number) => void
  handleLabel: (item: T, index: number) => string
  children: (item: T, index: number, handle: ReactNode) => ReactNode
  className?: string
}) {
  const [listRef, setAnimate] = useAutoAnimate<HTMLOListElement>({ duration: 180 })
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const ids = items.map((item) => item.id)
  const onDragEnd = (event: DragEndEvent) => {
    window.setTimeout(() => setAnimate(true), 0)
    const { active, over } = event
    if (!over || active.id === over.id) return
    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setAnimate(false)} onDragEnd={onDragEnd} onDragCancel={() => setAnimate(true)}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol ref={listRef} className={cn("flex flex-col gap-2.5", className)}>
          {items.map((item, index) => (
            <Row key={item.id} id={item.id} handleLabel={handleLabel(item, index)}>
              {(handle) => children(item, index, handle)}
            </Row>
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
