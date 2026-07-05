"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { fetchDashboard, fetchLowStock, type DashboardStats, type LowStockItem } from "@/lib/api";

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchLowStock()])
      .then(([dashboard, items]) => {
        setStats(dashboard);
        setLowStock(items);
      })
      .catch(console.error);
  }, []);

  return (
    <AppShell>
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-slate-500">Inventory analytics and low-stock alerts</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold">Summary</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Total products: {stats?.total_products ?? "-"}</li>
            <li>Stock value: {stats ? `₹${stats.total_stock_value.toLocaleString()}` : "-"}</li>
            <li>Open POs: {stats?.open_purchase_orders ?? "-"}</li>
            <li>Open SOs: {stats?.open_sales_orders ?? "-"}</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold">Low Stock Items</h3>
          <table className="table mt-4">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Location</th>
                <th>Qty</th>
                <th>Reorder</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((item) => (
                <tr key={`${item.product_id}-${item.location_name}`}>
                  <td>{item.sku}</td>
                  <td>{item.location_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.reorder_level}</td>
                </tr>
              ))}
              {lowStock.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-slate-500">No low stock items</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
