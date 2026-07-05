"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchConfig, login, setToken, type AppConfig } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [email, setEmail] = useState("admin@company.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig()
      .then((cfg) => {
        setConfig(cfg);
        if (cfg.app.primary_color) {
          document.documentElement.style.setProperty("--brand-color", cfg.app.primary_color);
        }
      })
      .catch(() => setConfig(null));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = await login(email, password);
      setToken(token.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold">{config?.app.name || "Inventory Management"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {config?.app.tagline || "Sign in to manage your inventory"}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Default admin: admin@company.com / admin123
        </p>
      </div>
    </div>
  );
}
