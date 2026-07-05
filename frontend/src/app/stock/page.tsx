"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { adjustStock, fetchLocations, fetchProducts, fetchStock, type Location, type Product, type StockItem } from "@/lib/api";

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({ product_id: 0, location_id: 0, quantity: 0, notes: "" });

  async function load() {
    const [stockData, productData, locationData] = await Promise.all([
      fetchStock(),
      fetchProducts(),
      fetchLocations(),
    ]);
    setStock(stockData);
    setProducts(productData.items);
    setLocations(locationData);
    if (productData.items[0] && locationData[0]) {
      setForm((f) => ({
        ...f,
        product_id: f.product_id || productData.items[0].id,
        location_id: f.location_id || locationData[0].id,
      }));
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    await adjustStock(form);
    await load();
  }

  return (
    <AppShell>
      <div>
        <h2 className="text-2xl font-bold">Stock</h2>
        <p className="text-slate-500">View and adjust inventory levels by location</p>
      </div>

      <form onSubmit={handleAdjust} className="card mt-6 grid gap-4 md:grid-cols-4">
        <select className="input" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: Number(e.target.value) })}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
          ))}
        </select>
        <select className="input" value={form.location_id} onChange={(e) => setForm({ ...form, location_id: Number(e.target.value) })}>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <input className="input" type="number" placeholder="Quantity (+/-)" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        <button className="btn-primary" type="submit">Adjust Stock</button>
      </form>

      <div className="card mt-6 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Location</th>
              <th>On Hand</th>
              <th>Reserved</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((row) => (
              <tr key={row.id}>
                <td>{row.product.sku} - {row.product.name}</td>
                <td>{row.location.name}</td>
                <td>{row.quantity}</td>
                <td>{row.reserved}</td>
                <td>{row.available}</td>
              </tr>
            ))}
            {stock.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-slate-500">No stock records yet. Adjust stock to create entries.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
