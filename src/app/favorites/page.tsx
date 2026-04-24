import AppShell from "@/components/AppShell";
import FavoritesClient from "@/components/FavoritesClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function FavoritesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const categories = await prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } });
  return <AppShell title="邮箱收藏" subtitle="收藏邮箱地址，并按 Google、Outlook 等分类整理。"><FavoritesClient categories={categories} /></AppShell>;
}
