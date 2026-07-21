import { arrayMove } from "@dnd-kit/sortable";
import type { ReorderItem } from "@/features/course-management/chapters-schema";

export function applyOptimisticReorder<T>(
  items: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  return arrayMove(items, fromIndex, toIndex);
}

export function buildReorderPayload<T extends { id: number }>(
  items: T[],
): ReorderItem[] {
  return items.map((item, idx) => ({ id: item.id, order: idx + 1 }));
}

export function rollbackReorder<T>(previousItems: T[]): T[] {
  return [...previousItems];
}
