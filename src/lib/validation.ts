import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  name: z.string().trim().max(80).optional().or(z.literal("")),
  password: z.string().min(8, "密码至少 8 位"),
});

export const loginSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  password: z.string().min(1, "请输入密码"),
});

const favoriteFields = {
  displayName: z.string().trim().max(120).optional().nullable(),
  note: z.string().optional().nullable(),
  isStarred: z.boolean().optional(),
  categoryId: z.string().optional().nullable().or(z.literal("")),
};

export const favoriteSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱地址"),
  ...favoriteFields,
});

export const favoriteCreateSchema = z.object({
  email: z.string().trim().optional().nullable(),
  emails: z.union([z.string(), z.array(z.string())]).optional(),
  ...favoriteFields,
}).refine((data) => Boolean(data.email || data.emails), { message: "请输入有效邮箱地址", path: ["email"] });

export const categorySchema = z.object({
  name: z.string().trim().min(1, "分类名必填").max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "颜色必须是 hex").default("#2563eb"),
});

export const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["delete", "star", "unstar", "move"]),
  categoryId: z.string().optional().nullable(),
});
