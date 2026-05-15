"use client";

import { FormEvent, useEffect, useState } from "react";

type Item = { id: string; name: string; color?: string; favoriteCount?: number };

type Props = {
  title: string;
  endpoint: "/api/categories";
  listKey: "categories";
  color?: boolean;
};

export default function ResourceManager({ title, endpoint, listKey, color }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const showFavoriteCount = endpoint === "/api/categories";
  const columnCount = 2 + (color ? 1 : 0) + (showFavoriteCount ? 1 : 0);

  async function load() {
    const response = await fetch(endpoint);
    const data = await response.json();
    setItems(data[listKey] ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = { name: String(form.get("name") ?? ""), ...(color ? { color: String(form.get("color") ?? "#2563eb") } : {}) };
    const response = await fetch(editing ? `${endpoint}/${editing.id}` : endpoint, {
      method: editing ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "保存失败");
      return;
    }
    setEditing(null);
    formElement.reset();
    await load();
  }

  async function remove(id: string) {
    if (!confirm("确认删除？关联邮箱收藏不会被删除。")) return;
    await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>{editing ? `编辑${title}` : `新增${title}`}</h2>
        <form className="toolbar" onSubmit={submit}>
          <label className="field"><span>名称</span><input key={editing?.id ?? "new"} className="input" name="name" defaultValue={editing?.name ?? ""} required /></label>
          {color && <label className="field"><span>颜色</span><input className="input" name="color" type="color" defaultValue={editing?.color ?? "#2563eb"} /></label>}
          <button className="btn">保存</button>
          {editing && <button type="button" className="btn secondary" onClick={() => setEditing(null)}>取消</button>}
        </form>
        {error && <div className="error">{error}</div>}
      </div>
      <div className="card">
        <h2>{title}列表</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>名称</th>{color && <th>颜色</th>}{showFavoriteCount && <th>邮箱数量</th>}<th>操作</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td data-label="名称">{item.name}</td>
                  {color && <td data-label="颜色"><span className="badge" style={{ background: item.color }}>{item.color}</span></td>}
                  {showFavoriteCount && <td data-label="邮箱数量"><span className="badge gray">{item.favoriteCount ?? 0}</span></td>}
                  <td data-label="操作" className="actions"><button className="btn small secondary" onClick={() => setEditing(item)}>编辑</button><button className="btn small danger" onClick={() => remove(item.id)}>删除</button></td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={columnCount} className="empty">暂无数据</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
