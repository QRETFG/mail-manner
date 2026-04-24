import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { errorResponse, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const data = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return json({ error: "邮箱或密码错误" }, 401);
    }
    await createSession(user.id);
    return json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    return errorResponse(error);
  }
}
