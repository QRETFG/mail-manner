import { errorResponse, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const data = categorySchema.parse(await request.json());
    const result = await prisma.category.updateMany({ where: { id, userId: user.id }, data });
    if (!result.count) return json({ error: "分类不存在" }, 404);
    return json({ category: await prisma.category.findUnique({ where: { id } }) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await prisma.category.deleteMany({ where: { id, userId: user.id } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
