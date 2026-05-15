import { describe, expect, it } from "vitest";
import { normalizeEmail, parseBool, parseEmailList, parseImportContent } from "@/lib/favorites";
import { favoriteSchema } from "@/lib/validation";

describe("favorite helpers", () => {
  it("validates required email address", () => {
    expect(() => favoriteSchema.parse({ email: "" })).toThrow();
    expect(() => favoriteSchema.parse({ email: "not-email" })).toThrow();
    expect(favoriteSchema.parse({ email: "user@example.com" }).email).toBe("user@example.com");
  });

  it("normalizes email addresses", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("parses bulk email input with common separators", () => {
    const result = parseEmailList("A@Example.com\nb@example.com, c@example.com;d@example.com e@example.com");
    expect(result.emails).toEqual(["a@example.com", "b@example.com", "c@example.com", "d@example.com", "e@example.com"]);
    expect(result.invalid).toEqual([]);
    expect(result.total).toBe(5);
  });

  it("dedupes normalized bulk email input", () => {
    const result = parseEmailList(["User@Example.com", " user@example.com, other@example.com "]);
    expect(result.emails).toEqual(["user@example.com", "other@example.com"]);
    expect(result.duplicates).toBe(1);
  });

  it("reports invalid bulk email values", () => {
    const result = parseEmailList("valid@example.com not-email missing@domain");
    expect(result.emails).toEqual(["valid@example.com"]);
    expect(result.invalid).toEqual(["not-email", "missing@domain"]);
  });

  it("parses import CSV", () => {
    const rows = parseImportContent("email,displayName,category,note,isStarred\na@example.com,主账号,Google,常用,yes", "csv");
    expect(rows).toHaveLength(1);
    expect(rows[0].category).toBe("Google");
    expect(rows[0].displayName).toBe("主账号");
  });

  it("parses localized import CSV headers", () => {
    const rows = parseImportContent("邮箱地址,显示名,分类,备注,星标\na@example.com,主账号,Google,常用,是", "csv");
    expect(rows[0].email).toBe("a@example.com");
    expect(rows[0].category).toBe("Google");
    expect(rows[0].isStarred).toBe("是");
  });

  it("parses headerless email CSV", () => {
    const rows = parseImportContent("a@example.com\nb@example.com", "csv");
    expect(rows).toHaveLength(2);
    expect(rows[1].email).toBe("b@example.com");
  });

  it("parses import JSON", () => {
    const rows = parseImportContent(JSON.stringify([{ email: "a@example.com", displayName: 123, category: "Google" }]), "json");
    expect(rows[0].email).toBe("a@example.com");
    expect(rows[0].displayName).toBe(123);
  });

  it("parses exported JSON category objects", () => {
    const rows = parseImportContent(JSON.stringify([{ email: "a@example.com", category: { name: "Google", color: "#2563eb" } }]), "json");
    expect(rows[0].category).toEqual({ name: "Google", color: "#2563eb" });
  });

  it("parses boolean values", () => {
    expect(parseBool("yes")).toBe(true);
    expect(parseBool("否")).toBe(false);
  });
});
