import { errorResponse, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { importFavorites, parseImportContent } from "@/lib/favorites";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    const selectedType = form.get("type") === "json" ? "json" : "csv";
    if (!file || typeof file !== "object" || !("text" in file) || typeof file.text !== "function") return json({ error: "请上传 CSV 或 JSON 文件" }, 400);
    const fileName = "name" in file && typeof file.name === "string" ? file.name.toLowerCase() : "";
    const type = fileName.endsWith(".json") ? "json" : fileName.endsWith(".csv") ? "csv" : selectedType;
    const rows = parseImportContent(await file.text(), type);
    const result = await importFavorites(user.id, rows);
    return json(result);
  } catch (error) {
    if (error instanceof Error) return json({ error: error.message }, 400);
    return errorResponse(error);
  }
}
