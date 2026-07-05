"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";
import type { AppConfig, User } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/stock", label: "Stock" },
  { href: "/purchase-orders", label: "Purchase Orders", feature: "purchase_orders" },
  { href: "/sales-orders", label: "Sales Orders", feature: "sales_orders" },
  { href: "/barcode", label: "Barcode Scan", feature: "barcode" },
  { href: "/reports", label: "Reports", feature: "reports" },
];

export default function Sidebar({
  config,
  user,
}: {
  config: AppConfig | null;
  user: User | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = navItems.filter(
    (item) => !item.feature || config?.features[item.feature] !== false
  );

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-6">
        <h1 className="text-lg font-bold">{config?.app.name || "Inventory Management"}</h1>
        <p className="text-sm text-slate-500">{config?.app.company}</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                active ? "bg-blue-50 text-brand" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <p className="text-sm font-medium">{user?.full_name}</p>
        <p className="text-xs text-slate-500">{user?.role}</p>
        <button
          className="btn-secondary mt-3 w-full"
          onClick={() => {
            clearToken();
            router.push("/login");
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
