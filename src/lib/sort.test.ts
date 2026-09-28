import { describe, expect, it } from "vitest"
import { nextSort, sortRows } from "./sort"

describe("sort helpers", () => {
  const rows = [{ n: "Omar", v: 3 }, { n: "ahmad", v: null }, { n: "Laila", v: 10 }]
  const accessors = { name: (r: (typeof rows)[number]) => r.n, value: (r: (typeof rows)[number]) => r.v }

  it("toggles direction on the same column and resets on a new one", () => {
    expect(nextSort(null, "name")).toEqual({ key: "name", direction: "asc" })
    expect(nextSort({ key: "name", direction: "asc" }, "name")).toEqual({ key: "name", direction: "desc" })
    expect(nextSort({ key: "name", direction: "desc" }, "value")).toEqual({ key: "value", direction: "asc" })
  })

  it("sorts numbers numerically and sinks nulls", () => {
    expect(sortRows(rows, { key: "value", direction: "asc" }, accessors, "en").map((r) => r.v)).toEqual([3, 10, null])
    expect(sortRows(rows, { key: "value", direction: "desc" }, accessors, "en").map((r) => r.v)).toEqual([10, 3, null])
  })

  it("sorts text with the locale", () => {
    expect(sortRows(rows, { key: "name", direction: "asc" }, accessors, "en").map((r) => r.n)).toEqual(["ahmad", "Laila", "Omar"])
  })
})
