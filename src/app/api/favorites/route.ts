import { Prisma } from "@prisma/client";
import { errorResponse, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { favoriteInclude, normalizeEmail, toFavoriteDto } from "@/lib/favorites";
import { prisma } from "@/lib/prisma";
import { favoriteSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const categoryId = searchParams.get("categoryId") || undefined;
    const starred = searchParams.get("starred");

    const where: Prisma.EmailFavoriteWhereInput = {
      userId: user.id,
      ...(starred === "true" ? { isStarred: true } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(q ? { OR: ["email", "displayName", "note"].map((field) => ({ [field]: { contains: q } })) } : {}),
    };

    const favorites = await prisma.emailFavorite.findMany({
      where,
      include: favoriteInclude,
      orderBy: [{ isStarred: "desc" }, { updatedAt: "desc" }],
      take: 200,
    });
    return json({ favorites: favorites.map(toFavoriteDto) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = favoriteSchema.parse(await request.json());
    const favorite = await prisma.emailFavorite.create({
      data: {
        userId: user.id,
        email: normalizeEmail(data.email),
        displayName: data.displayName || null,
        note: data.note || null,
        isStarred: data.isStarred ?? false,
        categoryId: data.categoryId || null,
      },
      include: favoriteInclude,
    });
    return json({ favorite: toFavoriteDto(favorite) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
