from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "viewer"


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


class ProductBase(BaseModel):
    sku: str
    name: str
    description: str | None = None
    barcode: str | None = None
    category: str | None = None
    unit: str = "pcs"
    cost_price: float = 0.0
    sale_price: float = 0.0
    reorder_level: int = 10
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    barcode: str | None = None
    category: str | None = None
    unit: str | None = None
    cost_price: float | None = None
    sale_price: float | None = None
    reorder_level: int | None = None
    is_active: bool | None = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class LocationBase(BaseModel):
    name: str
    code: str
    address: str | None = None
    is_active: bool = True


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class SupplierBase(BaseModel):
    name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    address: str | None = None
    is_active: bool = True


class SupplierCreate(SupplierBase):
    pass


class SupplierResponse(SupplierBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class CustomerBase(BaseModel):
    name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    address: str | None = None
    is_active: bool = True


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class StockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    location_id: int
    quantity: int
    reserved: int
    available: int
    product: ProductResponse
    location: LocationResponse


class StockAdjustment(BaseModel):
    product_id: int
    location_id: int
    quantity: int
    notes: str | None = None


class POLineCreate(BaseModel):
    product_id: int
    quantity_ordered: int = Field(gt=0)
    unit_cost: float = 0.0


class POLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity_ordered: int
    quantity_received: int
    unit_cost: float
    product: ProductResponse


class POCreate(BaseModel):
    supplier_id: int
    location_id: int
    notes: str | None = None
    lines: list[POLineCreate]


class POResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    po_number: str
    supplier_id: int
    location_id: int
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
    lines: list[POLineResponse]
    supplier: SupplierResponse
    location: LocationResponse


class SOLineCreate(BaseModel):
    product_id: int
    quantity_ordered: int = Field(gt=0)
    unit_price: float = 0.0


class SOCreate(BaseModel):
    customer_id: int
    location_id: int
    notes: str | None = None
    lines: list[SOLineCreate]


class SOLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity_ordered: int
    quantity_fulfilled: int
    unit_price: float
    product: ProductResponse


class SOResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    so_number: str
    customer_id: int
    location_id: int
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
    lines: list[SOLineResponse]
    customer: CustomerResponse
    location: LocationResponse


class DashboardStats(BaseModel):
    total_products: int
    total_stock_value: float
    low_stock_count: int
    open_purchase_orders: int
    open_sales_orders: int
    total_locations: int


class LowStockItem(BaseModel):
    product_id: int
    sku: str
    name: str
    location_name: str
    quantity: int
    reorder_level: int


class AppConfigResponse(BaseModel):
    app: dict
    features: dict
    roles: list[str]
    order_statuses: dict
    stock: dict
