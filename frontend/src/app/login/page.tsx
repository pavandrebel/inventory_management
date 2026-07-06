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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 p-4">
      <div className="card w-full max-w-md bg-white rounded-xl shadow-xl p-8 space-y-6">
        {/* Logo / App Name */}
        <div className="flex flex-col items-center">
          {config?.app.logo_url ? (
            <img src={config.app.logo_url} alt="Logo" className="h-12 w-auto mb-2" />
          ) : (
            <div className="text-4xl font-bold text-purple-600">📦</div>
          )}
          <h1 className="text-2xl font-bold text-gray-800">{config?.app.name || "Inventory Management"}</h1>
          <p className="text-sm text-gray-500 text-center">{config?.app.tagline || "Sign in to manage your inventory"}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              className="input w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              className="input w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            className="btn-primary w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Footer note */}
        <p className="text-xs text-gray-400 text-center">
          Default admin: admin@company.com / admin123
        </p>
      </div>
    </div>
  );
}