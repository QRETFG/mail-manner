import AppShell from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [total, starred, categorized, categories] = await Promise.all([
    prisma.emailFavorite.count({ where: { userId: user.id } }),
    prisma.emailFavorite.count({ where: { userId: user.id, isStarred: true } }),
    prisma.emailFavorite.count({ where: { userId: user.id, categoryId: { not: null } } }),
    prisma.category.count({ where: { userId: user.id } }),
  ]);

  const recent = await prisma.emailFavorite.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: { category: true },
  });

  return (
    <AppShell title="仪表盘" subtitle="快速查看邮箱收藏规模和最近更新。">
      <div className="grid cols-4">
        <div className="card stat"><span>全部邮箱</span><strong>{total}</strong></div>
        <div className="card stat"><span>星标邮箱</span><strong>{starred}</strong></div>
        <div className="card stat"><span>已分类</span><strong>{categorized}</strong></div>
        <div className="card stat"><span>分类数</span><strong>{categories}</strong></div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h2>最近更新</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>邮箱地址</th><th>显示名</th><th>分类</th><th>更新时间</th></tr></thead>
            <tbody>
              {recent.map((item) => <tr key={item.id}><td className="email-text">{item.email}</td><td>{item.displayName || "-"}</td><td>{item.category?.name || "未分类"}</td><td>{item.updatedAt.toLocaleString("zh-CN")}</td></tr>)}
              {!recent.length && <tr><td colSpan={4} className="empty">还没有收藏，去邮箱收藏新增第一个邮箱地址。</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
