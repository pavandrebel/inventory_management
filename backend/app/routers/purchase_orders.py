from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models import POStatus, PurchaseOrder, PurchaseOrderLine, Supplier, User
from app.schemas import POCreate, POResponse, SupplierCreate, SupplierResponse
from app.services.inventory import generate_po_number, receive_purchase_order

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])


@router.get("/suppliers", response_model=list[SupplierResponse])
def list_suppliers(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    return db.query(Supplier).filter(Supplier.is_active.is_(True)).order_by(Supplier.name).all()


@router.post("/suppliers", response_model=SupplierResponse, status_code=201)
def create_supplier(
    payload: SupplierCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("suppliers"))],
):
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("", response_model=list[POResponse])
def list_purchase_orders(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    return (
        db.query(PurchaseOrder)
        .options(
            joinedload(PurchaseOrder.lines).joinedload(PurchaseOrderLine.product),
            joinedload(PurchaseOrder.supplier),
            joinedload(PurchaseOrder.location),
        )
        .order_by(PurchaseOrder.created_at.desc())
        .all()
    )


@router.post("", response_model=POResponse, status_code=201)
def create_purchase_order(
    payload: POCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("purchase_orders"))],
):
    po = PurchaseOrder(
        po_number=generate_po_number(db),
        supplier_id=payload.supplier_id,
        location_id=payload.location_id,
        notes=payload.notes,
        status=POStatus.DRAFT.value,
        created_by_id=current_user.id,
    )
    db.add(po)
    db.flush()
    for line in payload.lines:
        db.add(
            PurchaseOrderLine(
                purchase_order_id=po.id,
                product_id=line.product_id,
                quantity_ordered=line.quantity_ordered,
                unit_cost=line.unit_cost,
            )
        )
    db.commit()
    po = (
        db.query(PurchaseOrder)
        .options(
            joinedload(PurchaseOrder.lines).joinedload(PurchaseOrderLine.product),
            joinedload(PurchaseOrder.supplier),
            joinedload(PurchaseOrder.location),
        )
        .filter(PurchaseOrder.id == po.id)
        .first()
    )
    return po


@router.post("/{po_id}/approve", response_model=POResponse)
def approve_purchase_order(
    po_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("purchase_orders"))],
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    po.status = POStatus.APPROVED.value
    db.commit()
    return _load_po(db, po_id)


@router.post("/{po_id}/receive", response_model=POResponse)
def receive_po(
    po_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("purchase_orders"))],
):
    try:
        receive_purchase_order(db, po_id, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _load_po(db, po_id)


def _load_po(db: Session, po_id: int) -> PurchaseOrder:
    po = (
        db.query(PurchaseOrder)
        .options(
            joinedload(PurchaseOrder.lines).joinedload(PurchaseOrderLine.product),
            joinedload(PurchaseOrder.supplier),
            joinedload(PurchaseOrder.location),
        )
        .filter(PurchaseOrder.id == po_id)
        .first()
    )
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po
