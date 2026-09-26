import { describe, expect, it } from "vitest"
import {
  listHref,
  parseStudentFilters,
  parseSubscriptionFilters,
  parseTeacherFilters,
  serializeStudentFilters,
  serializeSubscriptionFilters,
  serializeTeacherFilters,
} from "../url-state"

const params = (query: string) => new URLSearchParams(query)

describe("admin list URL state", () => {
  it("falls back to defaults for missing or invalid values", () => {
    expect(parseTeacherFilters(params("status=bogus&library=x&page=-2&view=abc&sort=nope"))).toEqual({
      q: "",
      status: "all",
      library: "all",
      sort: null,
      page: 1,
      view: null,
    })
    expect(parseSubscriptionFilters(params("status=unknown")).status).toBe("completed")
    expect(parseStudentFilters(params("grade=0&stream=1.5")).grade).toBeNull()
  })

  it("parses deep-link filters used by the overview tiles and attention panel", () => {
    expect(parseTeacherFilters(params("status=inactive&library=missing&view=7"))).toMatchObject({
      status: "inactive",
      library: "missing",
      view: 7,
    })
    expect(parseSubscriptionFilters(params("status=duplicate_paid")).status).toBe("duplicate_paid")
    expect(parseStudentFilters(params("status=active&grade=3&stream=2&q=%20ali%20"))).toMatchObject({
      status: "active",
      grade: 3,
      stream: 2,
      q: "ali",
    })
  })

  it("parses sort key and direction, defaulting to ascending", () => {
    expect(parseTeacherFilters(params("sort=joined")).sort).toEqual({ key: "joined", direction: "asc" })
    expect(parseSubscriptionFilters(params("sort=amount&dir=desc")).sort).toEqual({ key: "amount", direction: "desc" })
    expect(parseStudentFilters(params("sort=amount")).sort).toBeNull()
  })

  it("omits defaults when serializing and round-trips everything else", () => {
    const teacher = parseTeacherFilters(params(""))
    expect(serializeTeacherFilters(teacher).toString()).toBe("")

    const query = "status=active&library=ready&q=math&sort=name&dir=desc&page=3&view=9"
    expect(parseTeacherFilters(serializeTeacherFilters(parseTeacherFilters(params(query))))).toEqual(
      parseTeacherFilters(params(query)),
    )
    expect(serializeSubscriptionFilters(parseSubscriptionFilters(params("status=completed"))).toString()).toBe("")
    expect(serializeSubscriptionFilters(parseSubscriptionFilters(params("status=all"))).toString()).toBe("status=all")
    expect(serializeStudentFilters(parseStudentFilters(params("grade=4&sort=level"))).toString()).toBe("grade=4&sort=level")
  })

  it("builds list hrefs without a dangling question mark", () => {
    expect(listHref("/admin/teachers", new URLSearchParams())).toBe("/admin/teachers")
    expect(listHref("/admin/teachers", params("status=inactive"))).toBe("/admin/teachers?status=inactive")
  })
})
