"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ChapterNavigationState {
  scrollY: number;
  expandedLessonIds: Set<number>;
}

interface ChapterNavigationContextValue {
  getState: (courseId: number, chapterId: number) => ChapterNavigationState;
  setState: (courseId: number, chapterId: number, state: ChapterNavigationState) => void;
}

const ChapterNavigationContext = createContext<ChapterNavigationContextValue | null>(null);

export function ChapterNavigationProvider({ children }: { children: ReactNode }) {
  const [store] = useState<Map<string, ChapterNavigationState>>(new Map());

  const getKey = useCallback((courseId: number, chapterId: number) => `${courseId}:${chapterId}`, []);

  const getState = useCallback(
    (courseId: number, chapterId: number): ChapterNavigationState => {
      const key = getKey(courseId, chapterId);
      const saved = store.get(key);
      return saved ?? { scrollY: 0, expandedLessonIds: new Set() };
    },
    [getKey, store],
  );

  const setState = useCallback(
    (courseId: number, chapterId: number, state: ChapterNavigationState) => {
      const key = getKey(courseId, chapterId);
      store.set(key, state);
    },
    [getKey, store],
  );

  return (
    <ChapterNavigationContext.Provider value={{ getState, setState }}>
      {children}
    </ChapterNavigationContext.Provider>
  );
}

export function useChapterNavigation() {
  const ctx = useContext(ChapterNavigationContext);
  if (!ctx) throw new Error("useChapterNavigation must be used within ChapterNavigationProvider");
  return ctx;
}
