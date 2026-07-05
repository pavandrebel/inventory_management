"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchConfig, fetchMe, getToken, type AppConfig, type User } from "@/lib/api";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }
      try {
        const [cfg, me] = await Promise.all([fetchConfig(), fetchMe()]);
        setConfig(cfg);
        setUser(me);
        if (cfg.app.primary_color) {
          document.documentElement.style.setProperty("--brand-color", cfg.app.primary_color);
        }
      } catch {
        router.replace("/login");
        return;
      }
      setReady(true);
    }
    load();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar config={config} user={user} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
