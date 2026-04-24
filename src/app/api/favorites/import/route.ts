import { errorResponse, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { importFavorites, parseImportContent } from "@/lib/favorites";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    const type = form.get("type") === "json" ? "json" : "csv";
    if (!(file instanceof File)) return json({ error: "请上传文件" }, 400);
    const rows = parseImportContent(await file.text(), type);
    const result = await importFavorites(user.id, rows);
    return json(result);
  } catch (error) {
    if (error instanceof Error) return json({ error: error.message }, 400);
    return errorResponse(error);
  }
}
