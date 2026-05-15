import { Prisma } from "@prisma/client";
import { errorResponse, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { favoriteInclude, normalizeEmail, parseEmailList, toFavoriteDto } from "@/lib/favorites";
import { prisma } from "@/lib/prisma";
import { favoriteCreateSchema } from "@/lib/validation";

const pageSize = 10;

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const categoryId = searchParams.get("categoryId") || undefined;
    const starred = searchParams.get("starred");
    const requestedPage = parsePage(searchParams.get("page"));

    const where: Prisma.EmailFavoriteWhereInput = {
      userId: user.id,
      ...(starred === "true" ? { isStarred: true } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(q ? { OR: ["email", "displayName", "note"].map((field) => ({ [field]: { contains: q } })) } : {}),
    };

    const total = await prisma.emailFavorite.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const favorites = await prisma.emailFavorite.findMany({
      where,
      include: favoriteInclude,
      orderBy: [{ isStarred: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return json({ favorites: favorites.map(toFavoriteDto), pagination: { page, pageSize, total, totalPages } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = favoriteCreateSchema.parse(await request.json());
    const parsed = parseEmailList(data.emails ?? data.email ?? "");
    const errors = parsed.invalid.map((email) => ({ email, reason: "邮箱地址格式不正确" }));

    if (!parsed.emails.length) {
      return json({ error: parsed.total ? "没有可新增的有效邮箱" : "请输入有效邮箱地址", errors }, 400);
    }

    const isBatch = data.emails !== undefined || parsed.total > 1;
    const sharedData = {
      userId: user.id,
      displayName: data.displayName || null,
      note: data.note || null,
      isStarred: data.isStarred ?? false,
      categoryId: data.categoryId || null,
    };

    if (!isBatch) {
      const favorite = await prisma.emailFavorite.create({
        data: {
          ...sharedData,
          email: normalizeEmail(parsed.emails[0]),
        },
        include: favoriteInclude,
      });
      return json({ favorite: toFavoriteDto(favorite), created: 1, skipped: 0, errors: [] }, 201);
    }

    const existingFavorites = await prisma.emailFavorite.findMany({
      where: { userId: user.id, email: { in: parsed.emails } },
      select: { email: true },
    });
    const existingEmails = new Set(existingFavorites.map((favorite) => favorite.email));
    const emailsToCreate = parsed.emails.filter((email) => !existingEmails.has(email));
    const favorites = emailsToCreate.length
      ? await prisma.$transaction(emailsToCreate.map((email) => prisma.emailFavorite.create({
        data: { ...sharedData, email },
        include: favoriteInclude,
      })))
      : [];

    return json({
      favorites: favorites.map(toFavoriteDto),
      favorite: favorites[0] ? toFavoriteDto(favorites[0]) : null,
      created: favorites.length,
      skipped: existingEmails.size + parsed.duplicates,
      errors,
    }, favorites.length ? 201 : 200);
  } catch (error) {
    return errorResponse(error);
  }
}
