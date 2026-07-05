from sqlalchemy.orm import Session, joinedload

from app.models import (
    Customer,
    Location,
    MovementType,
    POStatus,
    Product,
    PurchaseOrder,
    PurchaseOrderLine,
    SOStatus,
    SalesOrder,
    SalesOrderLine,
    Stock,
    StockMovement,
    Supplier,
)
from app.schemas import StockAdjustment


def get_or_create_stock(db: Session, product_id: int, location_id: int) -> Stock:
    stock = (
        db.query(Stock)
        .filter(Stock.product_id == product_id, Stock.location_id == location_id)
        .first()
    )
    if stock:
        return stock
    stock = Stock(product_id=product_id, location_id=location_id, quantity=0, reserved=0)
    db.add(stock)
    db.flush()
    return stock


def record_movement(
    db: Session,
    *,
    product_id: int,
    location_id: int,
    movement_type: str,
    quantity: int,
    reference: str | None = None,
    notes: str | None = None,
    user_id: int | None = None,
) -> StockMovement:
    movement = StockMovement(
        product_id=product_id,
        location_id=location_id,
        movement_type=movement_type,
        quantity=quantity,
        reference=reference,
        notes=notes,
        created_by_id=user_id,
    )
    db.add(movement)
    return movement


def adjust_stock(db: Session, payload: StockAdjustment, user_id: int | None = None) -> Stock:
    stock = get_or_create_stock(db, payload.product_id, payload.location_id)
    stock.quantity += payload.quantity
    if stock.quantity < 0:
        raise ValueError("Insufficient stock for adjustment")

    movement_type = MovementType.ADJUSTMENT.value
    if payload.quantity > 0:
        movement_type = MovementType.IN.value
    elif payload.quantity < 0:
        movement_type = MovementType.OUT.value

    record_movement(
        db,
        product_id=payload.product_id,
        location_id=payload.location_id,
        movement_type=movement_type,
        quantity=abs(payload.quantity),
        notes=payload.notes,
        user_id=user_id,
    )
    db.commit()
    db.refresh(stock)
    return stock


def generate_po_number(db: Session) -> str:
    count = db.query(PurchaseOrder).count() + 1
    return f"PO-{count:05d}"


def generate_so_number(db: Session) -> str:
    count = db.query(SalesOrder).count() + 1
    return f"SO-{count:05d}"


def receive_purchase_order(db: Session, po_id: int, user_id: int | None = None) -> PurchaseOrder:
    po = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.lines).joinedload(PurchaseOrderLine.product))
        .filter(PurchaseOrder.id == po_id)
        .first()
    )
    if not po:
        raise ValueError("Purchase order not found")
    if po.status == POStatus.CANCELLED.value:
        raise ValueError("Cannot receive a cancelled purchase order")

    for line in po.lines:
        remaining = line.quantity_ordered - line.quantity_received
        if remaining <= 0:
            continue
        stock = get_or_create_stock(db, line.product_id, po.location_id)
        stock.quantity += remaining
        line.quantity_received += remaining
        record_movement(
            db,
            product_id=line.product_id,
            location_id=po.location_id,
            movement_type=MovementType.IN.value,
            quantity=remaining,
            reference=po.po_number,
            notes="PO received",
            user_id=user_id,
        )

    all_received = all(line.quantity_received >= line.quantity_ordered for line in po.lines)
    any_received = any(line.quantity_received > 0 for line in po.lines)
    if all_received:
        po.status = POStatus.RECEIVED.value
    elif any_received:
        po.status = POStatus.PARTIALLY_RECEIVED.value

    db.commit()
    db.refresh(po)
    return po


def fulfill_sales_order(db: Session, so_id: int, user_id: int | None = None) -> SalesOrder:
    so = (
        db.query(SalesOrder)
        .options(joinedload(SalesOrder.lines).joinedload(SalesOrderLine.product))
        .filter(SalesOrder.id == so_id)
        .first()
    )
    if not so:
        raise ValueError("Sales order not found")
    if so.status == SOStatus.CANCELLED.value:
        raise ValueError("Cannot fulfill a cancelled sales order")

    for line in so.lines:
        remaining = line.quantity_ordered - line.quantity_fulfilled
        if remaining <= 0:
            continue
        stock = get_or_create_stock(db, line.product_id, so.location_id)
        available = stock.quantity - stock.reserved
        if available < remaining:
            raise ValueError(f"Insufficient stock for product {line.product_id}")
        stock.quantity -= remaining
        if stock.reserved >= remaining:
            stock.reserved -= remaining
        line.quantity_fulfilled += remaining
        record_movement(
            db,
            product_id=line.product_id,
            location_id=so.location_id,
            movement_type=MovementType.OUT.value,
            quantity=remaining,
            reference=so.so_number,
            notes="SO fulfilled",
            user_id=user_id,
        )

    all_fulfilled = all(line.quantity_fulfilled >= line.quantity_ordered for line in so.lines)
    if all_fulfilled:
        so.status = SOStatus.SHIPPED.value
    else:
        so.status = SOStatus.PICKING.value

    db.commit()
    db.refresh(so)
    return so
