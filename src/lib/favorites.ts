import { Prisma } from "@prisma/client";
import Papa from "papaparse";
import { prisma } from "./prisma";

export type FavoriteImportRow = {
  email: unknown;
  displayName?: unknown;
  category?: unknown;
  categoryName?: unknown;
  分类?: unknown;
  note?: unknown;
  isStarred?: unknown;
  [key: string]: unknown;
};

const csvHeaderMap: Record<string, string> = {
  email: "email",
  邮箱: "email",
  邮箱地址: "email",
  displayname: "displayName",
  name: "displayName",
  显示名: "displayName",
  名称: "displayName",
  category: "category",
  分类: "category",
  note: "note",
  备注: "note",
  isstarred: "isStarred",
  starred: "isStarred",
  星标: "isStarred",
};

export const favoriteInclude = {
  category: true,
} satisfies Prisma.EmailFavoriteInclude;

const emailSeparators = /[\s,;，；]+/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmailAddress(email: string) {
  return emailPattern.test(email);
}

export function parseEmailList(input: string | string[]) {
  const rawParts = Array.isArray(input) ? input : [input];
  const seen = new Set<string>();
  const emails: string[] = [];
  const invalid: string[] = [];
  let duplicates = 0;
  let total = 0;

  for (const rawPart of rawParts) {
    for (const rawValue of String(rawPart).split(emailSeparators)) {
      const value = rawValue.trim();
      if (!value) continue;
      total += 1;

      const email = normalizeEmail(value);
      if (!isValidEmailAddress(email)) {
        invalid.push(value);
        continue;
      }

      if (seen.has(email)) {
        duplicates += 1;
        continue;
      }

      seen.add(email);
      emails.push(email);
    }
  }

  return { emails, invalid, duplicates, total };
}

export function parseBool(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return ["true", "1", "yes", "是", "y"].includes(value.trim().toLowerCase());
}

export function toFavoriteDto(favorite: Prisma.EmailFavoriteGetPayload<{ include: typeof favoriteInclude }>) {
  return {
    ...favorite,
    createdAt: favorite.createdAt.toISOString(),
    updatedAt: favorite.updatedAt.toISOString(),
  };
}

export async function getOrCreateCategory(userId: string, name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return prisma.category.upsert({
    where: { userId_name: { userId, name: trimmed } },
    update: {},
    create: { userId, name: trimmed, color: colorFromName(trimmed) },
  });
}

function colorFromName(name: string) {
  const colors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2"];
  const sum = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

export async function importFavorites(userId: string, rows: FavoriteImportRow[]) {
  const errors: { row: number; reason: string }[] = [];
  let created = 0;
  let skipped = 0;

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    const email = normalizeEmail(cellToString(row.email));
    if (!email) {
      errors.push({ row: line, reason: "邮箱地址必填" });
      continue;
    }
    if (!isValidEmailAddress(email)) {
      errors.push({ row: line, reason: "邮箱地址格式不正确" });
      continue;
    }

    const duplicate = await prisma.emailFavorite.findUnique({ where: { userId_email: { userId, email } } });
    if (duplicate) {
      skipped += 1;
      continue;
    }

    const category = await getOrCreateCategory(userId, categoryToString(row));
    await prisma.emailFavorite.create({
      data: {
        userId,
        email,
        displayName: cellToString(row.displayName) || null,
        note: cellToString(row.note) || null,
        isStarred: parseBool(row.isStarred),
        categoryId: category?.id ?? null,
      },
    });
    created += 1;
  }

  return { created, skipped, errors };
}

export function parseImportContent(content: string, type: "json" | "csv") {
  if (!content.trim()) throw new Error("导入文件不能为空");

  if (type === "json") {
    const data = JSON.parse(content) as unknown;
    if (!Array.isArray(data)) throw new Error("JSON 必须是数组");
    return data as FavoriteImportRow[];
  }

  const result = Papa.parse<FavoriteImportRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => csvHeaderMap[header.trim().replace(/^\uFEFF/, "").toLowerCase()] ?? header.trim(),
  });
  if (!result.meta.fields?.includes("email")) return parseHeaderlessCsv(content);
  if (result.errors.length) throw new Error(result.errors[0]?.message ?? "CSV 解析失败");
  return result.data;
}

function parseHeaderlessCsv(content: string): FavoriteImportRow[] {
  const result = Papa.parse<unknown[]>(content, { header: false, skipEmptyLines: true });
  const blockingError = result.errors.find((error) => error.code !== "UndetectableDelimiter");
  if (blockingError) throw new Error(blockingError.message ?? "CSV 解析失败");
  const rows = result.data
    .map((row) => ({ email: cellToString(row[0]), displayName: cellToString(row[1]), category: cellToString(row[2]), note: cellToString(row[3]), isStarred: cellToString(row[4]) }))
    .filter((row) => row.email);
  if (!rows.length) throw new Error("CSV 缺少 email 表头，且未识别到邮箱地址列表");
  return rows;
}

function cellToString(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function categoryToString(row: FavoriteImportRow) {
  const value = row.category ?? row.categoryName ?? row.分类;
  if (value && typeof value === "object" && "name" in value) return cellToString(value.name);
  return cellToString(value);
}

export function favoritesToCsv(rows: ReturnType<typeof toFavoriteDto>[]) {
  return Papa.unparse(rows.map((favorite) => ({
    email: favorite.email,
    displayName: favorite.displayName ?? "",
    category: favorite.category?.name ?? "",
    note: favorite.note ?? "",
    isStarred: favorite.isStarred,
  })));
}
