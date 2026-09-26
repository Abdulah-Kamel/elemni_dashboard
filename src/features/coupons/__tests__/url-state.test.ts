import { describe, expect, it } from "vitest"
import { listQueryFor, parseCouponFilters, scanQuery, serializeCouponFilters } from "../url-state"

const parse = (query: string) => parseCouponFilters(new URLSearchParams(query))

describe("coupon URL state", () => {
  it("parses defaults from an empty query", () => {
    expect(parse("")).toEqual({ q: "", status: "all", flag: "none", sort: null, page: 1, view: null })
  })

  it("round-trips filters, sort, page and the open coupon", () => {
    const filters = parse("q=save&status=exhausted&sort=usage&dir=desc&page=3&view=save20")
    expect(filters).toEqual({ q: "save", status: "exhausted", flag: "none", sort: { key: "usage", direction: "desc" }, page: 3, view: "SAVE20" })
    expect(serializeCouponFilters(filters).toString()).toBe("status=exhausted&q=save&sort=usage&dir=desc&page=3&view=SAVE20")
  })

  it("ignores unknown values", () => {
    expect(parse("status=deleted&sort=price&page=-2&view=%3Cscript%3E&flag=later")).toEqual(parse(""))
  })

  it("lets an attention flag own the status", () => {
    const filters = parse("flag=near_cap&status=expired")
    expect(filters).toMatchObject({ flag: "near_cap", status: "active" })
    expect(serializeCouponFilters(filters).toString()).toBe("flag=near_cap")
  })

  it("maps table sorting and pages onto API parameters", () => {
    expect(listQueryFor(parse("q=vip&status=active&sort=validity&page=2"))).toEqual({
      q: "vip",
      status: "active",
      sort_by: "expires_at",
      sort_order: "asc",
      skip: 10,
      limit: 10,
    })
    expect(listQueryFor(parse(""))).toEqual({ skip: 0, limit: 10 })
  })

  it("requests one scan page of active coupons for flag views", () => {
    expect(listQueryFor(parse("flag=expiring&page=2"))).toEqual(scanQuery())
    expect(scanQuery()).toMatchObject({ status: "active", limit: 100, skip: 0 })
  })
})
