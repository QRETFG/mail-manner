"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "操作失败");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const isRegister = mode === "register";
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{isRegister ? "创建账号" : "欢迎回来"}</h1>
        <p>{isRegister ? "注册后开始收藏和整理邮箱地址。" : "登录邮箱收藏管理系统。"}</p>
        <form className="form" onSubmit={submit}>
          {isRegister && <label className="field"><span>昵称</span><input className="input" name="name" autoComplete="name" placeholder="可选" /></label>}
          <label className="field"><span>邮箱</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
          <label className="field"><span>密码</span><input className="input" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 8 : 1} required /></label>
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={loading}>{loading ? "处理中..." : isRegister ? "注册并进入" : "登录"}</button>
        </form>
        <p style={{ marginTop: 18 }}>
          {isRegister ? "已有账号？" : "还没有账号？"}
          <Link className="btn ghost" href={isRegister ? "/login" : "/register"}>{isRegister ? "去登录" : "去注册"}</Link>
        </p>
      </div>
    </div>
  );
}
