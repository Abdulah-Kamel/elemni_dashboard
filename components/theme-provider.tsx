"use client";

import * as React from "react";

/**
 * Applies the persisted / system-preference theme on mount, exposes the
 * `d` keyboard shortcut, and broadcasts a `themechange` event whenever the
 * DOM class changes so other on-screen consumers (e.g. the topbar's
 * `<ThemeToggle />`, which reads via `useSyncExternalStore`) stay in sync.
 *
 * The DOM is the source of truth — no React state. This file's job is to
 * (1) seed the DOM on first paint and (2) wire the keyboard shortcut.
 */

const STORAGE_KEY = "theme";
const CHANGE_EVENT = "themechange";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function readInitialTheme(): "light" | "dark" {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage may be unavailable (private mode, SSR)
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignored
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Seed the DOM with the persisted / system-preference theme on first paint.
  React.useEffect(() => {
    applyTheme(readInitialTheme());
  }, []);

  // Keyboard shortcut: `d` toggles the theme. No deps — the handler reads
  // the current theme from the DOM at call time, so it never goes stale.
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // `event.key` is undefined for some edge cases (IME composition,
      // synthetic events, modifier-only keys). Treat those as no-ops.
      const key = event.key?.toLowerCase();
      if (key !== "d") return;
      if (isTypingTarget(event.target as EventTarget)) return;
      const next: "light" | "dark" = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <>{children}</>;
}
