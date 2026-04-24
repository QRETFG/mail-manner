import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { errorResponse, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const data = registerSchema.parse(await request.json());
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name || null,
        passwordHash: await bcrypt.hash(data.password, 12),
      },
      select: { id: true, email: true, name: true },
    });
    await createSession(user.id);
    return json({ user }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
