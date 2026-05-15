import { errorResponse, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      include: { _count: { select: { favorites: true } } },
    });
    return json({
      categories: categories.map(({ _count, ...category }) => ({ ...category, favoriteCount: _count.favorites })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = categorySchema.parse(await request.json());
    const category = await prisma.category.create({ data: { ...data, userId: user.id } });
    return json({ category }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
