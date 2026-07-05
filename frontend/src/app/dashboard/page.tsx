"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { fetchDashboard, type DashboardStats } from "@/lib/api";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboard().then(setStats).catch(console.error);
  }, []);

  return (
    <AppShell>
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-slate-500">Overview of your inventory operations</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total Products" value={stats?.total_products ?? "-"} />
          <StatCard label="Stock Value" value={stats ? `₹${stats.total_stock_value.toLocaleString()}` : "-"} />
          <StatCard label="Low Stock Items" value={stats?.low_stock_count ?? "-"} />
          <StatCard label="Open Purchase Orders" value={stats?.open_purchase_orders ?? "-"} />
          <StatCard label="Open Sales Orders" value={stats?.open_sales_orders ?? "-"} />
          <StatCard label="Active Locations" value={stats?.total_locations ?? "-"} />
        </div>
      </div>
    </AppShell>
  );
}
