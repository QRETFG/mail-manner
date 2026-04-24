import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>邮箱收藏管理</strong>
          <span>邮箱地址，一站收藏分类</span>
        </div>
        <nav className="nav">
          <Link href="/dashboard">仪表盘</Link>
          <Link href="/favorites">邮箱收藏</Link>
          <Link href="/categories">分类管理</Link>
          <Link href="/import-export">导入导出</Link>
        </nav>
        <div className="sidebar-footer">
          <span>{user.name || user.email}</span>
          <LogoutButton />
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
