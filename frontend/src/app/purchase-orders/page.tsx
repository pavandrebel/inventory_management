"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  approvePO,
  createPurchaseOrder,
  fetchLocations,
  fetchProducts,
  fetchPurchaseOrders,
  fetchSuppliers,
  receivePO,
  type Location,
  type Product,
  type PurchaseOrder,
  type Supplier,
} from "@/lib/api";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ supplier_id: 0, location_id: 0, product_id: 0, quantity: 1, unit_cost: 0 });

  async function load() {
    const [orderData, supplierData, locationData, productData] = await Promise.all([
      fetchPurchaseOrders(),
      fetchSuppliers(),
      fetchLocations(),
      fetchProducts(),
    ]);
    setOrders(orderData);
    setSuppliers(supplierData);
    setLocations(locationData);
    setProducts(productData.items);
    setForm((f) => ({
      ...f,
      supplier_id: f.supplier_id || supplierData[0]?.id || 0,
      location_id: f.location_id || locationData[0]?.id || 0,
      product_id: f.product_id || productData.items[0]?.id || 0,
    }));
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createPurchaseOrder({
      supplier_id: form.supplier_id,
      location_id: form.location_id,
      lines: [{ product_id: form.product_id, quantity_ordered: form.quantity, unit_cost: form.unit_cost }],
    });
    await load();
  }

  return (
    <AppShell>
      <div>
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        <p className="text-slate-500">Create, approve, and receive supplier orders</p>
      </div>

      <form onSubmit={handleCreate} className="card mt-6 grid gap-4 md:grid-cols-5">
        <select className="input" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: Number(e.target.value) })}>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" value={form.location_id} onChange={(e) => setForm({ ...form, location_id: Number(e.target.value) })}>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className="input" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: Number(e.target.value) })}>
          {products.map((p) => <option key={p.id} value={p.id}>{p.sku}</option>)}
        </select>
        <input className="input" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        <button className="btn-primary" type="submit">Create PO</button>
      </form>

      <div className="card mt-6 space-y-4">
        {orders.map((po) => (
          <div key={po.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{po.po_number}</p>
                <p className="text-sm text-slate-500">{po.supplier.name} → {po.location.name}</p>
              </div>
              <span className="badge bg-blue-50 text-blue-700">{po.status}</span>
            </div>
            <ul className="mt-3 text-sm text-slate-600">
              {po.lines.map((line) => (
                <li key={line.id}>
                  {line.product.sku}: {line.quantity_received}/{line.quantity_ordered} received
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              {po.status === "draft" && (
                <button className="btn-secondary" onClick={() => approvePO(po.id).then(load)}>Approve</button>
              )}
              {["approved", "ordered", "partially_received"].includes(po.status) && (
                <button className="btn-primary" onClick={() => receivePO(po.id).then(load)}>Receive</button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-slate-500">No purchase orders yet.</p>}
      </div>
    </AppShell>
  );
}
