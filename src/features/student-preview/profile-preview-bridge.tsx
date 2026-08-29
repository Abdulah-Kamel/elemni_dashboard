"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"

export type ProfilePreviewField =
  "name" | "bio" | "location" | "experience" | "avatar"

interface ProfilePreviewBridgeValue {
  enabled: boolean
  hoveredField: ProfilePreviewField | null
  selectedField: ProfilePreviewField | null
  setHoveredField: (field: ProfilePreviewField | null) => void
  highlightField: (field: ProfilePreviewField) => void
  clearSelectedField: (field: ProfilePreviewField) => void
  selectField: (field: ProfilePreviewField) => void
}

const fallbackBridge: ProfilePreviewBridgeValue = {
  enabled: false,
  hoveredField: null,
  selectedField: null,
  setHoveredField: () => undefined,
  highlightField: () => undefined,
  clearSelectedField: () => undefined,
  selectField: () => undefined,
}

const ProfilePreviewBridgeContext =
  createContext<ProfilePreviewBridgeValue>(fallbackBridge)

interface ProfilePreviewBridgeProviderProps {
  children: React.ReactNode
  enabled?: boolean
  onSelectField?: (field: ProfilePreviewField) => void
}

/**
 * Keeps the student-facing profile preview and its editor in sync without
 * coupling either surface to the other. The provider scopes focus queries to
 * this workspace so another file input on the page cannot be targeted.
 */
export function ProfilePreviewBridgeProvider({
  children,
  enabled = true,
  onSelectField,
}: ProfilePreviewBridgeProviderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [hoveredField, setHoveredField] = useState<ProfilePreviewField | null>(
    null
  )
  const [selectedField, setSelectedField] =
    useState<ProfilePreviewField | null>(null)

  const highlightField = useCallback(
    (field: ProfilePreviewField) => {
      if (enabled) setSelectedField(field)
    },
    [enabled]
  )

  const clearSelectedField = useCallback((field: ProfilePreviewField) => {
    setSelectedField((current) => (current === field ? null : current))
  }, [])

  const focusEditorField = useCallback((field: ProfilePreviewField) => {
    const root = rootRef.current
    if (!root) return

    const fieldRoot = root.querySelector<HTMLElement>(
      `[data-profile-editor-field="${field}"]`
    )
    const target =
      field === "avatar"
        ? (fieldRoot?.querySelector<HTMLElement>('[role="button"]') ??
          fieldRoot)
        : (fieldRoot?.querySelector<HTMLElement>(
            `[data-profile-editor-input="${field}"]`
          ) ?? fieldRoot)

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
  }, [])

  const selectField = useCallback(
    (field: ProfilePreviewField) => {
      if (!enabled) return
      setSelectedField(field)
      onSelectField?.(field)
      focusEditorField(field)

      // A compact workspace may need one frame for the editor tab to become
      // visible before focus can be painted by the browser.
      if (onSelectField && typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => focusEditorField(field))
      }
    },
    [enabled, focusEditorField, onSelectField]
  )

  const value = useMemo(
    () => ({
      enabled,
      hoveredField,
      selectedField,
      setHoveredField,
      highlightField,
      clearSelectedField,
      selectField,
    }),
    [
      enabled,
      hoveredField,
      selectedField,
      highlightField,
      clearSelectedField,
      selectField,
    ]
  )

  return (
    <ProfilePreviewBridgeContext.Provider value={value}>
      <div ref={rootRef} data-profile-preview-bridge-root className="contents">
        {children}
      </div>
    </ProfilePreviewBridgeContext.Provider>
  )
}

export function useProfilePreviewBridge() {
  return useContext(ProfilePreviewBridgeContext)
}
