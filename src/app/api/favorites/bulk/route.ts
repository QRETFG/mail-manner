import { errorResponse, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bulkSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = bulkSchema.parse(await request.json());
    const where = { id: { in: data.ids }, userId: user.id };

    if (data.action === "delete") await prisma.emailFavorite.deleteMany({ where });
    if (data.action === "star") await prisma.emailFavorite.updateMany({ where, data: { isStarred: true } });
    if (data.action === "unstar") await prisma.emailFavorite.updateMany({ where, data: { isStarred: false } });
    if (data.action === "move") await prisma.emailFavorite.updateMany({ where, data: { categoryId: data.categoryId || null } });

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
