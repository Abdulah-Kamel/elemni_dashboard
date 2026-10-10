import {
  Atom,
  BookOpen,
  Calculator,
  Cpu,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  Leaf,
} from "lucide-react"

/** Subject icons and cover tones from the student portal, with no repo imports. */
export function getSubjectArt(subject: string | null | undefined) {
  const value = subject?.toLocaleLowerCase() ?? ""
  if (value.includes("رياض") || value.includes("math"))
    return {
      Icon: Calculator,
      tone: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    }
  if (
    value.includes("أحيا") ||
    value.includes("احيا") ||
    value.includes("biology")
  )
    return {
      Icon: Leaf,
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    }
  if (value.includes("فيزي") || value.includes("physics"))
    return {
      Icon: Atom,
      tone: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    }
  if (value.includes("كيمي") || value.includes("chem"))
    return {
      Icon: FlaskConical,
      tone: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    }
  if (
    value.includes("كمبيوتر") ||
    value.includes("computer") ||
    value.includes("برمج")
  )
    return {
      Icon: Cpu,
      tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    }
  if (value.includes("جغراف") || value.includes("geograph"))
    return {
      Icon: Globe2,
      tone: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    }
  if (value.includes("تاريخ") || value.includes("history"))
    return {
      Icon: Landmark,
      tone: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    }
  if (
    ["english", "انجليز", "إنجليز", "عربي", "arabic", "فرنس", "french"].some(
      (name) => value.includes(name)
    )
  )
    return {
      Icon: Languages,
      tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    }
  return {
    Icon: BookOpen,
    tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  }
}
