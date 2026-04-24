import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import CopyButton from "@/components/CopyButton";
import { getSessionUser } from "@/lib/auth";
import { favoriteInclude } from "@/lib/favorites";
import { prisma } from "@/lib/prisma";

export default async function FavoriteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await params;
  const favorite = await prisma.emailFavorite.findFirst({ where: { id, userId: user!.id }, include: favoriteInclude });
  if (!favorite) notFound();

  return (
    <AppShell title="邮箱收藏详情" subtitle="查看邮箱地址、分类和备注信息。">
      <div className="card detail">
        <div className="actions"><Link className="btn secondary" href="/favorites">返回列表</Link></div>
        <div className="title-row"><h2>{favorite.isStarred ? "★ " : ""}{favorite.email}</h2><CopyButton value={favorite.email} label="复制邮箱" /></div>
        <div className="grid cols-4">
          <div><strong>显示名</strong><p className="muted">{favorite.displayName || "-"}</p></div>
          <div><strong>分类</strong><p className="muted">{favorite.category?.name || "未分类"}</p></div>
          <div><strong>创建时间</strong><p className="muted">{favorite.createdAt.toLocaleString("zh-CN")}</p></div>
          <div><strong>更新时间</strong><p className="muted">{favorite.updatedAt.toLocaleString("zh-CN")}</p></div>
        </div>
        {favorite.category && <div><strong>分类标识</strong><div className="badges" style={{ marginTop: 8 }}><span className="badge" style={{ background: favorite.category.color }}>{favorite.category.name}</span></div></div>}
        <div><strong>备注</strong><pre>{favorite.note || "未填写备注"}</pre></div>
      </div>
    </AppShell>
  );
}
