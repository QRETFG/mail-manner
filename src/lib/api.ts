import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  if (error instanceof ZodError) {
    return json({ error: "校验失败", details: error.flatten() }, 400);
  }
  if (error instanceof Error && error.message.includes("Unique constraint")) {
    return json({ error: "名称或邮箱已存在" }, 409);
  }
  console.error(error);
  return json({ error: "服务器错误" }, 500);
}
