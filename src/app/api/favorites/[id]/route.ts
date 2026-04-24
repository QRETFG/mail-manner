import { errorResponse, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { favoriteInclude, normalizeEmail, toFavoriteDto } from "@/lib/favorites";
import { prisma } from "@/lib/prisma";
import { favoriteSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const favorite = await prisma.emailFavorite.findFirst({ where: { id, userId: user.id }, include: favoriteInclude });
    if (!favorite) return json({ error: "收藏不存在" }, 404);
    return json({ favorite: toFavoriteDto(favorite) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.emailFavorite.findFirst({ where: { id, userId: user.id } });
    if (!existing) return json({ error: "收藏不存在" }, 404);
    const data = favoriteSchema.parse(await request.json());
    const favorite = await prisma.emailFavorite.update({
      where: { id },
      data: {
        email: normalizeEmail(data.email),
        displayName: data.displayName || null,
        note: data.note || null,
        isStarred: data.isStarred ?? false,
        categoryId: data.categoryId || null,
      },
      include: favoriteInclude,
    });
    return json({ favorite: toFavoriteDto(favorite) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await prisma.emailFavorite.deleteMany({ where: { id, userId: user.id } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
