import AppShell from "@/components/AppShell";
import ResourceManager from "@/components/ResourceManager";

export default function CategoriesPage() {
  return <AppShell title="分类管理" subtitle="用分类整理不同邮箱来源，例如 Google、Outlook、QQ 或公司邮箱。"><ResourceManager title="分类" endpoint="/api/categories" listKey="categories" color /></AppShell>;
}
