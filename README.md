# Inventory Management

A customizable, Docker-ready inventory management system for tracking products, stock, purchase orders, sales orders, barcodes, and reports — with role-based access control.

## Features

- **Products & barcodes** — SKU management with barcode lookup
- **Stock tracking** — Multi-location inventory with adjustments and audit trail
- **Purchase orders** — Create, approve, and receive from suppliers
- **Sales orders** — Create, confirm, and fulfill customer orders
- **Reports** — Dashboard metrics and low-stock alerts
- **User roles** — Admin, warehouse manager, purchasing, sales, viewer
- **Fully customizable** — Branding, features, and workflows via config files and environment variables
- **Docker & Ubuntu** — Runs in Docker Compose or directly on Ubuntu

## Quick start (Docker)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Or Ubuntu 22.04+ with Docker installed

### 1. Configure

```bash
cp .env.example .env
```

Edit `.env` and set secure values for `POSTGRES_PASSWORD` and `SECRET_KEY`.

Customize branding and features in `config/app.config.yaml` or via environment variables:

| Variable | Description |
|----------|-------------|
| `APP_NAME` | Application title |
| `APP_COMPANY` | Your company name |
| `APP_PRIMARY_COLOR` | Theme color (hex) |
| `APP_CURRENCY` | Currency code |
| `FEATURE_BARCODE` | Enable barcode module |
| `FEATURE_PURCHASE_ORDERS` | Enable PO module |
| `FEATURE_SALES_ORDERS` | Enable SO module |

### 2. Start

```bash
docker compose up --build -d
```

### 3. Open the app

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **API docs:** http://localhost:8000/docs

**Default login:** `admin@company.com` / `admin123`  
Change this password immediately in production.

## Deploy on Ubuntu (without Docker)

### Backend

```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv postgresql postgresql-contrib nginx

sudo -u postgres createuser inventory --createdb
sudo -u postgres psql -c "ALTER USER inventory WITH PASSWORD 'your_password';"
sudo -u postgres createdb -O inventory inventory_db

cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL=postgresql://inventory:your_password@localhost:5432/inventory_db
export SECRET_KEY=your_long_secret_key
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run build
npm start
```

Set `NEXT_PUBLIC_API_URL` to your backend URL before building.

## Project structure

```
inventory-management/
├── config/app.config.yaml   # Customization (features, roles, branding)
├── docker-compose.yml       # Full stack orchestration
├── backend/                 # FastAPI REST API
│   └── app/
│       ├── routers/         # API endpoints
│       ├── models.py        # Database models
│       └── services/        # Business logic
└── frontend/                # Next.js web UI
    └── src/app/             # Pages (dashboard, products, stock, etc.)
```

## API overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Authenticate |
| `GET /api/config` | App configuration |
| `GET /api/products` | List products |
| `GET /api/products/barcode/{code}` | Barcode lookup |
| `GET /api/stock` | Stock levels |
| `POST /api/stock/adjust` | Adjust stock |
| `GET /api/purchase-orders` | Purchase orders |
| `POST /api/purchase-orders/{id}/receive` | Receive PO |
| `GET /api/sales-orders` | Sales orders |
| `POST /api/sales-orders/{id}/fulfill` | Fulfill SO |
| `GET /api/reports/dashboard` | Dashboard stats |

## User roles

| Role | Permissions |
|------|-------------|
| admin | Full access |
| warehouse_manager | Stock, products, PO/SO, barcode, reports |
| purchasing | Products, POs, suppliers, reports |
| sales | Products, SOs, customers, stock read, reports |
| viewer | Read-only reports and stock |

## Production checklist

- [ ] Change default admin password
- [ ] Set strong `SECRET_KEY` and `POSTGRES_PASSWORD`
- [ ] Put HTTPS in front (nginx/Caddy + Let's Encrypt)
- [ ] Back up PostgreSQL regularly
- [ ] Restrict port 5432 to internal network only

## Stop services

```bash
docker compose down
```

To remove data volumes as well:

```bash
docker compose down -v
```

## License

MIT — use and modify freely for your company.
