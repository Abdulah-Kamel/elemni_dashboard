"use client"

import {
  createContext,
  use,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { useLocale, useTranslations } from "next-intl"
import { CornerDownLeft, Languages, Moon, Plus, Search, type LucideIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { usePathname, useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { isNavActive, navFor, type NavRole } from "@/features/shell/nav-config"
import { toggleTheme } from "@/features/shell/components/theme-toggle"
import { rankItems } from "./match"

type PaletteCommand = {
  id: string
  kind: "navigate" | "action"
  label: string
  keywords: string
  icon: LucideIcon
  current?: boolean
  run: () => void
}

type PaletteContextValue = { openPalette: () => void }

const PaletteContext = createContext<PaletteContextValue | null>(null)

/** Opens the palette from anywhere inside the provider (e.g. the top bar trigger). */
export function useCommandPalette(): PaletteContextValue {
  const ctx = use(PaletteContext)
  if (!ctx) throw new Error("useCommandPalette must be used inside CommandPaletteProvider")
  return ctx
}

export function isPaletteShortcut(event: Pick<globalThis.KeyboardEvent, "key" | "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">): boolean {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return false
  // `code` keeps the shortcut working on an Arabic keyboard layout.
  return event.code === "KeyK" || event.key.toLowerCase() === "k"
}

export function CommandPaletteProvider({
  role,
  children,
}: {
  role: NavRole
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!isPaletteShortcut(event)) return
      event.preventDefault()
      setOpen((value) => !value)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const value = useMemo(() => ({ openPalette: () => setOpen(true) }), [])

  return (
    <PaletteContext value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-slot="command-palette"
          showCloseButton={false}
          className="top-[12dvh] flex max-h-[min(34rem,76dvh)] w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden rounded-xl border border-border bg-surface p-0 text-on-surface shadow-xl outline-none sm:max-w-[36rem] motion-reduce:transition-none"
        >
          <PaletteBody role={role} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </PaletteContext>
  )
}

function useCommands(role: NavRole, onClose: () => void): PaletteCommand[] {
  const tNav = useTranslations("sidebar")
  const t = useTranslations("dashboardShell")
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  const navigate = (href: string) => () => {
    onClose()
    router.push(href as never)
  }

  const commands: PaletteCommand[] = navFor(role).map((item) => ({
    id: `nav-${item.id}`,
    kind: "navigate",
    label: tNav(item.id),
    keywords: t(`keywords.${item.id}` as never),
    icon: item.icon,
    current: isNavActive(item.href, pathname, role),
    run: navigate(item.href),
  }))

  // Quick actions only point at flows that already exist as routes or
  // client-side toggles; nothing here talks to the API.
  if (role === "teacher") {
    commands.push({
      id: "action-create-course",
      kind: "action",
      label: t("actions.create_course"),
      keywords: t("keywords.create_course"),
      icon: Plus,
      run: navigate("/courses/new"),
    })
  }
  if (role === "admin") {
    commands.push({
      id: "action-create-teacher",
      kind: "action",
      label: t("actions.create_teacher"),
      keywords: t("keywords.create_teacher"),
      icon: Plus,
      run: navigate("/admin/teachers?create=1"),
    })
  }
  commands.push(
    {
      id: "action-theme",
      kind: "action",
      label: t("actions.toggle_theme"),
      keywords: t("keywords.toggle_theme"),
      icon: Moon,
      run: () => {
        onClose()
        toggleTheme()
      },
    },
    {
      id: "action-locale",
      kind: "action",
      label: t("actions.switch_locale"),
      keywords: t("keywords.switch_locale"),
      icon: Languages,
      run: () => {
        onClose()
        router.replace(pathname as never, { locale: locale === "ar" ? "en" : "ar" })
      },
    }
  )
  return commands
}

function PaletteBody({ role, onClose }: { role: NavRole; onClose: () => void }) {
  const t = useTranslations("dashboardShell.palette")
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [rawActive, setActive] = useState(0)
  const commands = useCommands(role, onClose)

  const results = rankItems(commands, query)
  const pages = results.filter((command) => command.kind === "navigate")
  const actions = results.filter((command) => command.kind === "action")
  // Pages first, then actions: the flat order arrow keys walk through.
  const ordered = [...pages, ...actions]
  const active = ordered.length === 0 ? -1 : Math.min(rawActive, ordered.length - 1)
  const optionId = (command: PaletteCommand) => `${baseId}-${command.id}`
  const listboxId = `${baseId}-listbox`

  const moveTo = (index: number) => {
    if (ordered.length === 0) return
    const next = (index + ordered.length) % ordered.length
    setActive(next)
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)
    el?.scrollIntoView?.({ block: "nearest" })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveTo(active + 1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      moveTo(active - 1)
    } else if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault()
      ordered[active]?.run()
    }
  }

  const renderGroup = (label: string, items: PaletteCommand[], offset: number, key: string) => {
    if (items.length === 0) return null
    const headingId = `${baseId}-${key}`
    return (
      <div role="group" aria-labelledby={headingId} className="py-1">
        <p id={headingId} className="px-3 pb-1 pt-2 text-label-sm font-semibold text-on-surface-muted">
          {label}
        </p>
        {items.map((command, i) => {
          const index = offset + i
          const Icon = command.icon
          const isActive = index === active
          return (
            <div
              key={command.id}
              id={optionId(command)}
              role="option"
              aria-selected={isActive}
              aria-current={command.current ? "page" : undefined}
              data-index={index}
              onPointerMove={() => {
                if (!isActive) setActive(index)
              }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={command.run}
              className={cn(
                "flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-body-lg transition-colors duration-100 motion-reduce:transition-none",
                isActive ? "bg-primary-tint text-primary" : "text-on-surface"
              )}
            >
              <Icon
                className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-on-surface-muted")}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{command.label}</span>
              {command.current && (
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
              )}
              {isActive && (
                <CornerDownLeft className="size-3.5 shrink-0 text-primary rtl:-scale-x-100" aria-hidden="true" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <DialogTitle className="sr-only">{t("title")}</DialogTitle>
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-on-surface-muted" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(ordered[active]) : undefined}
          aria-label={t("title")}
          placeholder={t("placeholder")}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-muted"
        />
        <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-sans text-label-sm text-on-surface-muted sm:inline">
          Esc
        </kbd>
      </div>

      <div
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-label={t("title")}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
      >
        {renderGroup(t("group_navigate"), pages, 0, "pages")}
        {renderGroup(t("group_actions"), actions, pages.length, "actions")}
        {ordered.length === 0 && (
          <p className="px-3 py-8 text-center text-body-md text-on-surface-muted">
            {t("empty", { query: query.trim() })}
          </p>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {t("results", { count: ordered.length })}
      </p>

      <div
        aria-hidden="true"
        className="hidden items-center gap-4 border-t border-border bg-surface-muted/60 px-4 py-2 text-label-sm text-on-surface-muted sm:flex"
      >
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          {t("hint_move")}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          {t("hint_open")}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>Esc</Kbd>
          {t("hint_close")}
        </span>
      </div>
    </>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-border bg-surface px-1 font-sans text-label-sm text-on-surface-muted">
      {children}
    </kbd>
  )
}
