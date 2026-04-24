import { errorResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { favoriteInclude, favoritesToCsv, toFavoriteDto } from "@/lib/favorites";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") === "csv" ? "csv" : "json";
    const rows = (await prisma.emailFavorite.findMany({
      where: { userId: user.id },
      include: favoriteInclude,
      orderBy: { updatedAt: "desc" },
    })).map(toFavoriteDto);

    if (type === "csv") {
      return new Response(favoritesToCsv(rows), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": "attachment; filename=email-favorites.csv",
        },
      });
    }

    return new Response(JSON.stringify(rows, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": "attachment; filename=email-favorites.json",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
