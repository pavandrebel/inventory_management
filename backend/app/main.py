from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_app_config, get_settings
from app.database import Base, engine, SessionLocal
from app.routers import auth, config, inventory, products, purchase_orders, reports, sales_orders
from app.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(config.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(purchase_orders.router, prefix="/api")
app.include_router(sales_orders.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "app": get_app_config().get("app", {}).get("name", settings.app_name)}
