"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { lookupBarcode, type Product } from "@/lib/api";

export default function BarcodePage() {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setProduct(null);
    try {
      const result = await lookupBarcode(barcode.trim());
      setProduct(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    }
  }

  return (
    <AppShell>
      <div>
        <h2 className="text-2xl font-bold">Barcode Scan</h2>
        <p className="text-slate-500">Look up products by barcode (USB scanner or manual entry)</p>
      </div>

      <form onSubmit={handleLookup} className="card mt-6 flex flex-wrap gap-3">
        <input
          className="input max-w-md flex-1"
          placeholder="Scan or enter barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          autoFocus
        />
        <button className="btn-primary" type="submit">Lookup</button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {product && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            <div><dt className="text-slate-500">SKU</dt><dd>{product.sku}</dd></div>
            <div><dt className="text-slate-500">Barcode</dt><dd>{product.barcode}</dd></div>
            <div><dt className="text-slate-500">Category</dt><dd>{product.category || "-"}</dd></div>
            <div><dt className="text-slate-500">Sale Price</dt><dd>₹{product.sale_price}</dd></div>
          </dl>
        </div>
      )}
    </AppShell>
  );
}
