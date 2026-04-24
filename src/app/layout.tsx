import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "邮箱收藏管理系统",
  description: "管理、检索、分类和导入导出邮箱地址收藏",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
