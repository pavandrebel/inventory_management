from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models import Location, Product, Stock, User
from app.schemas import LocationCreate, LocationResponse, StockAdjustment, StockResponse
from app.services.inventory import adjust_stock

router = APIRouter(tags=["inventory"])


@router.get("/locations", response_model=list[LocationResponse])
def list_locations(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    return db.query(Location).filter(Location.is_active.is_(True)).order_by(Location.name).all()


@router.post("/locations", response_model=LocationResponse, status_code=201)
def create_location(
    payload: LocationCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("*"))],
):
    location = Location(**payload.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.get("/stock", response_model=list[StockResponse])
def list_stock(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    location_id: int | None = None,
):
    query = (
        db.query(Stock)
        .options(joinedload(Stock.product), joinedload(Stock.location))
        .join(Product)
        .join(Location)
    )
    if location_id:
        query = query.filter(Stock.location_id == location_id)
    rows = query.order_by(Product.name).all()
    return [
        StockResponse(
            id=row.id,
            product_id=row.product_id,
            location_id=row.location_id,
            quantity=row.quantity,
            reserved=row.reserved,
            available=row.quantity - row.reserved,
            product=row.product,
            location=row.location,
        )
        for row in rows
    ]


@router.post("/stock/adjust", response_model=StockResponse)
def adjust_stock_endpoint(
    payload: StockAdjustment,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("stock"))],
):
    try:
        stock = adjust_stock(db, payload, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    db.refresh(stock)
    stock = (
        db.query(Stock)
        .options(joinedload(Stock.product), joinedload(Stock.location))
        .filter(Stock.id == stock.id)
        .first()
    )
    return StockResponse(
        id=stock.id,
        product_id=stock.product_id,
        location_id=stock.location_id,
        quantity=stock.quantity,
        reserved=stock.reserved,
        available=stock.quantity - stock.reserved,
        product=stock.product,
        location=stock.location,
    )
