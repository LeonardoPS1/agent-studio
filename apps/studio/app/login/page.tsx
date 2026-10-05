"use client";
import { useState } from "react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (r.ok) { window.location.href = "/app"; return; }
    setError((await r.json().catch(() => ({}))).error ?? "No se pudo iniciar sesión");
    setBusy(false);
  }

  return (
    <main className="login">
      <form onSubmit={submit} className="login-card">
        <h1>Agent Studio</h1>
        <p className="muted">Mission Control para tus agentes</p>
        <label htmlFor="password">Contraseña
          <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password" />
        </label>
        <button type="submit" className="primary" disabled={busy || !password}>{busy ? "Entrando…" : "Entrar"}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </main>
  );
}
