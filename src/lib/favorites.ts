import { Prisma } from "@prisma/client";
import Papa from "papaparse";
import { prisma } from "./prisma";

export type FavoriteImportRow = {
  email: string;
  displayName?: string;
  category?: string;
  note?: string;
  isStarred?: string | boolean;
};

export const favoriteInclude = {
  category: true,
} satisfies Prisma.EmailFavoriteInclude;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
    const email = normalizeEmail(row.email ?? "");
    if (!email) {
      errors.push({ row: line, reason: "邮箱地址必填" });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: line, reason: "邮箱地址格式不正确" });
      continue;
    }

    const duplicate = await prisma.emailFavorite.findUnique({ where: { userId_email: { userId, email } } });
    if (duplicate) {
      skipped += 1;
      continue;
    }

    const category = await getOrCreateCategory(userId, row.category);
    await prisma.emailFavorite.create({
      data: {
        userId,
        email,
        displayName: row.displayName?.trim() || null,
        note: row.note || null,
        isStarred: parseBool(row.isStarred),
        categoryId: category?.id ?? null,
      },
    });
    created += 1;
  }

  return { created, skipped, errors };
}

export function parseImportContent(content: string, type: "json" | "csv") {
  if (type === "json") {
    const data = JSON.parse(content) as unknown;
    if (!Array.isArray(data)) throw new Error("JSON 必须是数组");
    return data as FavoriteImportRow[];
  }

  const result = Papa.parse<FavoriteImportRow>(content, { header: true, skipEmptyLines: true });
  if (result.errors.length) throw new Error(result.errors[0]?.message ?? "CSV 解析失败");
  return result.data;
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
