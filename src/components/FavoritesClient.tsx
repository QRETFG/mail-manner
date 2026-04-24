"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import CopyButton from "./CopyButton";

type Category = { id: string; name: string; color: string };
type Favorite = {
  id: string;
  email: string;
  displayName: string | null;
  note: string | null;
  isStarred: boolean;
  categoryId: string | null;
  category: Category | null;
  updatedAt: string;
};

type Draft = Partial<Favorite>;

const emptyDraft: Draft = { email: "", displayName: "", note: "", categoryId: "", isStarred: false };

export default function FavoritesClient({ categories }: { categories: Category[] }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [filters, setFilters] = useState({ q: "", categoryId: "", starred: "" });
  const [error, setError] = useState("");
  const allSelected = favorites.length > 0 && selected.length === favorites.length;

  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString(), [filters]);

  async function load() {
    const response = await fetch(`/api/favorites?${query}`);
    const data = await response.json();
    setFavorites(data.favorites ?? []);
    setSelected([]);
  }

  useEffect(() => { void load(); }, [query]);

  function openEdit(favorite?: Favorite) {
    setError("");
    setDraft(favorite ? { ...favorite } : emptyDraft);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setError("");
    const response = await fetch(draft.id ? `/api/favorites/${draft.id}` : "/api/favorites", {
      method: draft.id ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "保存失败");
      return;
    }
    setDraft(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("确认删除这个邮箱收藏？")) return;
    await fetch(`/api/favorites/${id}`, { method: "DELETE" });
    await load();
  }

  async function bulk(action: string, extra: Record<string, unknown> = {}) {
    if (!selected.length) return alert("请先选择收藏");
    if (action === "delete" && !confirm("确认批量删除？")) return;
    await fetch("/api/favorites/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: selected, action, ...extra }) });
    await load();
  }

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="toolbar">
          <label className="field"><span>关键词</span><input className="input" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="邮箱/名称/备注" /></label>
          <label className="field"><span>分类</span><select className="select" value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}><option value="">全部</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="field"><span>星标</span><select className="select" value={filters.starred} onChange={(e) => setFilters({ ...filters, starred: e.target.value })}><option value="">全部</option><option value="true">仅星标</option></select></label>
          <button className="btn" onClick={() => openEdit()}>新增邮箱</button>
        </div>
        <div className="actions" style={{ marginBottom: 12 }}>
          <button className="btn small secondary" onClick={() => bulk("star")}>批量星标</button>
          <button className="btn small secondary" onClick={() => bulk("unstar")}>取消星标</button>
          <select className="select" style={{ width: 180 }} onChange={(e) => e.target.value && bulk("move", { categoryId: e.target.value })} defaultValue=""><option value="">移动到分类</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <button className="btn small danger" onClick={() => bulk("delete")}>批量删除</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th><input type="checkbox" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? favorites.map((f) => f.id) : [])} /></th><th>邮箱地址</th><th>显示名</th><th>分类</th><th>备注</th><th>操作</th></tr></thead>
            <tbody>
              {favorites.map((favorite) => (
                <tr key={favorite.id}>
                  <td data-label="选择"><input type="checkbox" checked={selected.includes(favorite.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, favorite.id] : selected.filter((id) => id !== favorite.id))} /></td>
                  <td data-label="邮箱地址"><div className="email-cell"><span className="email-text">{favorite.isStarred ? "★ " : ""}{favorite.email}</span><CopyButton value={favorite.email} /></div><span className="muted email-text">{new Date(favorite.updatedAt).toLocaleString("zh-CN")}</span></td>
                  <td data-label="显示名">{favorite.displayName || "-"}</td>
                  <td data-label="分类">{favorite.category ? <span className="badge" style={{ background: favorite.category.color }}>{favorite.category.name}</span> : "未分类"}</td>
                  <td data-label="备注">{favorite.note || "-"}</td>
                  <td data-label="操作" className="actions"><Link className="btn small secondary" href={`/favorites/${favorite.id}`}>详情</Link><button className="btn small secondary" onClick={() => openEdit(favorite)}>编辑</button><button className="btn small danger" onClick={() => remove(favorite.id)}>删除</button></td>
                </tr>
              ))}
              {!favorites.length && <tr><td colSpan={6} className="empty">没有匹配的邮箱收藏。</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head"><h2>{draft.id ? "编辑邮箱收藏" : "新增邮箱收藏"}</h2><button className="btn secondary" onClick={() => setDraft(null)}>关闭</button></div>
            <form className="form" onSubmit={submit}>
              <div className="form-grid">
                <label className="field full"><span>邮箱地址 *</span><input className="input" type="email" value={draft.email ?? ""} onChange={(e) => setField("email", e.target.value)} required /></label>
                <label className="field"><span>显示名</span><input className="input" value={draft.displayName ?? ""} onChange={(e) => setField("displayName", e.target.value)} placeholder="例如：工作 Gmail" /></label>
                <label className="field"><span>分类</span><select className="select" value={draft.categoryId ?? ""} onChange={(e) => setField("categoryId", e.target.value)}><option value="">未分类</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label className="field full"><span>备注</span><textarea className="textarea" value={draft.note ?? ""} onChange={(e) => setField("note", e.target.value)} placeholder="用途、登录平台或其他说明" /></label>
                <label className="check"><input type="checkbox" checked={Boolean(draft.isStarred)} onChange={(e) => setField("isStarred", e.target.checked)} />星标</label>
              </div>
              {error && <div className="error">{error}</div>}
              <button className="btn">保存收藏</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
