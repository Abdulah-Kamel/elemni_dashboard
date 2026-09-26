// Base messages plus one file per redesign area, so areas can be edited
// independently. Each area file owns exactly one top-level namespace.
import baseAr from "./ar.json"
import baseEn from "./en.json"
import adminConsoleAr from "./areas/admin-console.ar.json"
import adminConsoleEn from "./areas/admin-console.en.json"
import adminCouponsAr from "./areas/admin-coupons.ar.json"
import adminCouponsEn from "./areas/admin-coupons.en.json"
import shellAr from "./areas/shell.ar.json"
import shellEn from "./areas/shell.en.json"
import teacherHomeAr from "./areas/teacher-home.ar.json"
import teacherHomeEn from "./areas/teacher-home.en.json"
import teacherWorkspaceAr from "./areas/teacher-workspace.ar.json"
import teacherWorkspaceEn from "./areas/teacher-workspace.en.json"

const areas = {
  ar: [shellAr, teacherHomeAr, adminConsoleAr, teacherWorkspaceAr, adminCouponsAr],
  en: [shellEn, teacherHomeEn, adminConsoleEn, teacherWorkspaceEn, adminCouponsEn],
}

const base = { ar: baseAr, en: baseEn }

/** Merged messages for a locale; also use this in component tests. */
export function messagesFor(locale: "ar" | "en") {
  return Object.assign({}, base[locale], ...areas[locale]) as typeof baseAr
}

export async function loadMessages(locale: "ar" | "en") {
  return messagesFor(locale)
}
