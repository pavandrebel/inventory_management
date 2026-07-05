"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createProduct, fetchProducts, type Product } from "@/lib/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    barcode: "",
    category: "",
    cost_price: 0,
    sale_price: 0,
    reorder_level: 10,
  });

  async function load() {
    const data = await fetchProducts(search);
    setProducts(data.items);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createProduct(form);
    setShowForm(false);
    setForm({ sku: "", name: "", barcode: "", category: "", cost_price: 0, sale_price: 0, reorder_level: 10 });
    await load();
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-slate-500">Manage SKUs, barcodes, and pricing</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mt-6 grid gap-4 md:grid-cols-2">
          <input className="input" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="input" type="number" placeholder="Cost price" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} />
          <input className="input" type="number" placeholder="Sale price" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })} />
          <button className="btn-primary md:col-span-2" type="submit">Save Product</button>
        </form>
      )}

      <div className="card mt-6">
        <input className="input mb-4 max-w-sm" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Barcode</th>
              <th>Category</th>
              <th>Cost</th>
              <th>Price</th>
              <th>Reorder</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.barcode || "-"}</td>
                <td>{p.category || "-"}</td>
                <td>₹{p.cost_price}</td>
                <td>₹{p.sale_price}</td>
                <td>{p.reorder_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
