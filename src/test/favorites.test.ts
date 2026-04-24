import { describe, expect, it } from "vitest";
import { normalizeEmail, parseBool, parseImportContent } from "@/lib/favorites";
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

  it("parses import CSV", () => {
    const rows = parseImportContent("email,displayName,category,note,isStarred\na@example.com,主账号,Google,常用,yes", "csv");
    expect(rows).toHaveLength(1);
    expect(rows[0].category).toBe("Google");
    expect(rows[0].displayName).toBe("主账号");
  });

  it("parses boolean values", () => {
    expect(parseBool("yes")).toBe(true);
    expect(parseBool("否")).toBe(false);
  });
});
