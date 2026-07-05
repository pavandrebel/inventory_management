export type AppConfig = {
  app: {
    name: string;
    company: string;
    tagline?: string;
    primary_color?: string;
    currency?: string;
  };
  features: Record<string, boolean>;
  roles: string[];
  order_statuses: Record<string, string[]>;
  stock: Record<string, unknown>;
};

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  barcode?: string | null;
  category?: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  reorder_level: number;
  is_active: boolean;
};

export type Location = {
  id: number;
  name: string;
  code: string;
};

export type StockItem = {
  id: number;
  quantity: number;
  reserved: number;
  available: number;
  product: Product;
  location: Location;
};

export type DashboardStats = {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  open_purchase_orders: number;
  open_sales_orders: number;
  total_locations: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }
  return response.json();
}

export const fetchConfig = () => api<AppConfig>("/api/config");
export const login = (email: string, password: string) =>
  api<{ access_token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
export const fetchMe = () => api<User>("/api/auth/me");
export const fetchDashboard = () => api<DashboardStats>("/api/reports/dashboard");
export const fetchProducts = (search = "") =>
  api<{ items: Product[]; total: number }>(`/api/products?search=${encodeURIComponent(search)}`);
export const fetchStock = () => api<StockItem[]>("/api/stock");
export const fetchLocations = () => api<Location[]>("/api/locations");
export const lookupBarcode = (barcode: string) => api<Product>(`/api/products/barcode/${barcode}`);
export const fetchPurchaseOrders = () => api<PurchaseOrder[]>("/api/purchase-orders");
export const fetchSalesOrders = () => api<SalesOrder[]>("/api/sales-orders");
export const fetchSuppliers = () => api<Supplier[]>("/api/purchase-orders/suppliers");
export const fetchCustomers = () => api<Customer[]>("/api/sales-orders/customers");
export const fetchLowStock = () => api<LowStockItem[]>("/api/reports/low-stock");

export type Supplier = { id: number; name: string };
export type Customer = { id: number; name: string };
export type LowStockItem = {
  product_id: number;
  sku: string;
  name: string;
  location_name: string;
  quantity: number;
  reorder_level: number;
};

export type OrderLine = {
  id: number;
  quantity_ordered: number;
  quantity_received?: number;
  quantity_fulfilled?: number;
  product: Product;
};

export type PurchaseOrder = {
  id: number;
  po_number: string;
  status: string;
  supplier: Supplier;
  location: Location;
  lines: OrderLine[];
  created_at: string;
};

export type SalesOrder = {
  id: number;
  so_number: string;
  status: string;
  customer: Customer;
  location: Location;
  lines: OrderLine[];
  created_at: string;
};

export const createProduct = (payload: Partial<Product>) =>
  api<Product>("/api/products", { method: "POST", body: JSON.stringify(payload) });

export const adjustStock = (payload: { product_id: number; location_id: number; quantity: number; notes?: string }) =>
  api<StockItem>("/api/stock/adjust", { method: "POST", body: JSON.stringify(payload) });

export const createPurchaseOrder = (payload: {
  supplier_id: number;
  location_id: number;
  lines: { product_id: number; quantity_ordered: number; unit_cost: number }[];
}) => api<PurchaseOrder>("/api/purchase-orders", { method: "POST", body: JSON.stringify(payload) });

export const createSalesOrder = (payload: {
  customer_id: number;
  location_id: number;
  lines: { product_id: number; quantity_ordered: number; unit_price: number }[];
}) => api<SalesOrder>("/api/sales-orders", { method: "POST", body: JSON.stringify(payload) });

export const approvePO = (id: number) => api<PurchaseOrder>(`/api/purchase-orders/${id}/approve`, { method: "POST" });
export const receivePO = (id: number) => api<PurchaseOrder>(`/api/purchase-orders/${id}/receive`, { method: "POST" });
export const confirmSO = (id: number) => api<SalesOrder>(`/api/sales-orders/${id}/confirm`, { method: "POST" });
export const fulfillSO = (id: number) => api<SalesOrder>(`/api/sales-orders/${id}/fulfill`, { method: "POST" });
