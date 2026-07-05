"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  confirmSO,
  createSalesOrder,
  fetchCustomers,
  fetchLocations,
  fetchProducts,
  fetchSalesOrders,
  fulfillSO,
  type Customer,
  type Location,
  type Product,
  type SalesOrder,
} from "@/lib/api";

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ customer_id: 0, location_id: 0, product_id: 0, quantity: 1, unit_price: 0 });

  async function load() {
    const [orderData, customerData, locationData, productData] = await Promise.all([
      fetchSalesOrders(),
      fetchCustomers(),
      fetchLocations(),
      fetchProducts(),
    ]);
    setOrders(orderData);
    setCustomers(customerData);
    setLocations(locationData);
    setProducts(productData.items);
    setForm((f) => ({
      ...f,
      customer_id: f.customer_id || customerData[0]?.id || 0,
      location_id: f.location_id || locationData[0]?.id || 0,
      product_id: f.product_id || productData.items[0]?.id || 0,
    }));
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createSalesOrder({
      customer_id: form.customer_id,
      location_id: form.location_id,
      lines: [{ product_id: form.product_id, quantity_ordered: form.quantity, unit_price: form.unit_price }],
    });
    await load();
  }

  return (
    <AppShell>
      <div>
        <h2 className="text-2xl font-bold">Sales Orders</h2>
        <p className="text-slate-500">Create, confirm, and fulfill customer orders</p>
      </div>

      <form onSubmit={handleCreate} className="card mt-6 grid gap-4 md:grid-cols-5">
        <select className="input" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: Number(e.target.value) })}>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={form.location_id} onChange={(e) => setForm({ ...form, location_id: Number(e.target.value) })}>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className="input" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: Number(e.target.value) })}>
          {products.map((p) => <option key={p.id} value={p.id}>{p.sku}</option>)}
        </select>
        <input className="input" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        <button className="btn-primary" type="submit">Create SO</button>
      </form>

      <div className="card mt-6 space-y-4">
        {orders.map((so) => (
          <div key={so.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{so.so_number}</p>
                <p className="text-sm text-slate-500">{so.customer.name} ← {so.location.name}</p>
              </div>
              <span className="badge bg-green-50 text-green-700">{so.status}</span>
            </div>
            <ul className="mt-3 text-sm text-slate-600">
              {so.lines.map((line) => (
                <li key={line.id}>
                  {line.product.sku}: {line.quantity_fulfilled}/{line.quantity_ordered} fulfilled
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              {so.status === "draft" && (
                <button className="btn-secondary" onClick={() => confirmSO(so.id).then(load)}>Confirm</button>
              )}
              {["confirmed", "picking", "packed"].includes(so.status) && (
                <button className="btn-primary" onClick={() => fulfillSO(so.id).then(load)}>Fulfill</button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-slate-500">No sales orders yet.</p>}
      </div>
    </AppShell>
  );
}
