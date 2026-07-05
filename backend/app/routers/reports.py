from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models import POStatus, Product, PurchaseOrder, SOStatus, SalesOrder, Stock, User
from app.schemas import DashboardStats, LowStockItem

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("reports"))],
):
    total_products = db.query(Product).filter(Product.is_active.is_(True)).count()
    stock_rows = db.query(Stock).options(joinedload(Stock.product)).all()
    total_stock_value = sum(row.quantity * row.product.cost_price for row in stock_rows)
    low_stock_count = sum(1 for row in stock_rows if row.quantity <= row.product.reorder_level)
    open_purchase_orders = db.query(PurchaseOrder).filter(PurchaseOrder.status.notin_([POStatus.RECEIVED.value, POStatus.CANCELLED.value])).count()
    open_sales_orders = db.query(SalesOrder).filter(SalesOrder.status.notin_([SOStatus.DELIVERED.value, SOStatus.CANCELLED.value])).count()
    total_locations = db.query(Stock.location_id).distinct().count()
    return DashboardStats(
        total_products=total_products,
        total_stock_value=round(total_stock_value, 2),
        low_stock_count=low_stock_count,
        open_purchase_orders=open_purchase_orders,
        open_sales_orders=open_sales_orders,
        total_locations=total_locations,
    )


@router.get("/low-stock", response_model=list[LowStockItem])
def low_stock(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("reports"))],
):
    rows = db.query(Stock).options(joinedload(Stock.product), joinedload(Stock.location)).all()
    items = []
    for row in rows:
        if row.quantity <= row.product.reorder_level:
            items.append(
                LowStockItem(
                    product_id=row.product_id,
                    sku=row.product.sku,
                    name=row.product.name,
                    location_name=row.location.name,
                    quantity=row.quantity,
                    reorder_level=row.product.reorder_level,
                )
            )
    return items
