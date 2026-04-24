"use client";

import { FormEvent, useState } from "react";

export default function ImportExportClient() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function importFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/favorites/import", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "导入失败");
      return;
    }
    setMessage(`导入完成：新增 ${data.created} 条，跳过重复 ${data.skipped} 条，错误 ${data.errors?.length ?? 0} 条。`);
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>导出邮箱收藏</h2>
        <p className="muted">导出当前账号下的全部邮箱地址收藏，可用于备份或迁移。</p>
        <div className="actions">
          <a className="btn" href="/api/favorites/export?type=json">导出 JSON</a>
          <a className="btn secondary" href="/api/favorites/export?type=csv">导出 CSV</a>
        </div>
      </div>
      <div className="card">
        <h2>导入邮箱收藏</h2>
        <p className="muted">CSV 表头：email,displayName,category,note,isStarred。分类不存在时会自动创建。</p>
        <form className="toolbar" onSubmit={importFile}>
          <label className="field"><span>格式</span><select className="select" name="type"><option value="csv">CSV</option><option value="json">JSON</option></select></label>
          <label className="field"><span>文件</span><input className="input" type="file" name="file" accept=".csv,.json,text/csv,application/json" required /></label>
          <button className="btn">开始导入</button>
        </form>
        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
