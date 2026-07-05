from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models import Customer, SOStatus, SalesOrder, SalesOrderLine, User
from app.schemas import CustomerCreate, CustomerResponse, SOCreate, SOResponse
from app.services.inventory import fulfill_sales_order, generate_so_number

router = APIRouter(prefix="/sales-orders", tags=["sales-orders"])


@router.get("/customers", response_model=list[CustomerResponse])
def list_customers(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    return db.query(Customer).filter(Customer.is_active.is_(True)).order_by(Customer.name).all()


@router.post("/customers", response_model=CustomerResponse, status_code=201)
def create_customer(
    payload: CustomerCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("customers"))],
):
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("", response_model=list[SOResponse])
def list_sales_orders(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    return (
        db.query(SalesOrder)
        .options(
            joinedload(SalesOrder.lines).joinedload(SalesOrderLine.product),
            joinedload(SalesOrder.customer),
            joinedload(SalesOrder.location),
        )
        .order_by(SalesOrder.created_at.desc())
        .all()
    )


@router.post("", response_model=SOResponse, status_code=201)
def create_sales_order(
    payload: SOCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("sales_orders"))],
):
    so = SalesOrder(
        so_number=generate_so_number(db),
        customer_id=payload.customer_id,
        location_id=payload.location_id,
        notes=payload.notes,
        status=SOStatus.DRAFT.value,
        created_by_id=current_user.id,
    )
    db.add(so)
    db.flush()
    for line in payload.lines:
        db.add(
            SalesOrderLine(
                sales_order_id=so.id,
                product_id=line.product_id,
                quantity_ordered=line.quantity_ordered,
                unit_price=line.unit_price,
            )
        )
    db.commit()
    return _load_so(db, so.id)


@router.post("/{so_id}/confirm", response_model=SOResponse)
def confirm_sales_order(
    so_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("sales_orders"))],
):
    so = db.query(SalesOrder).filter(SalesOrder.id == so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found")
    so.status = SOStatus.CONFIRMED.value
    db.commit()
    return _load_so(db, so_id)


@router.post("/{so_id}/fulfill", response_model=SOResponse)
def fulfill_so(
    so_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("sales_orders"))],
):
    try:
        fulfill_sales_order(db, so_id, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _load_so(db, so_id)


def _load_so(db: Session, so_id: int) -> SalesOrder:
    so = (
        db.query(SalesOrder)
        .options(
            joinedload(SalesOrder.lines).joinedload(SalesOrderLine.product),
            joinedload(SalesOrder.customer),
            joinedload(SalesOrder.location),
        )
        .filter(SalesOrder.id == so_id)
        .first()
    )
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return so
