import AppShell from "@/components/AppShell";
import ImportExportClient from "@/components/ImportExportClient";

export default function ImportExportPage() {
  return <AppShell title="导入导出" subtitle="备份、迁移或批量录入邮箱地址收藏。"><ImportExportClient /></AppShell>;
}
