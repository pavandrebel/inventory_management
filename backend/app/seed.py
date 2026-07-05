from sqlalchemy.orm import Session

from app.auth import get_password_hash
from app.models import (
    Customer,
    Location,
    Product,
    Supplier,
    User,
    UserRole,
)


def seed_database(db: Session) -> None:
    if db.query(User).first():
        return

    admin = User(
        email="admin@company.com",
        full_name="System Administrator",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN.value,
    )
    db.add(admin)

    main_warehouse = Location(name="Main Warehouse", code="WH-MAIN", address="Default location")
    db.add(main_warehouse)
    db.flush()

    supplier = Supplier(name="Default Supplier", contact_email="supplier@example.com")
    customer = Customer(name="Default Customer", contact_email="customer@example.com")
    db.add_all([supplier, customer])

    products = [
        Product(sku="SKU-001", name="Widget A", barcode="8901234567890", category="General", cost_price=100, sale_price=150, reorder_level=20),
        Product(sku="SKU-002", name="Widget B", barcode="8901234567891", category="General", cost_price=200, sale_price=280, reorder_level=15),
        Product(sku="SKU-003", name="Widget C", barcode="8901234567892", category="Electronics", cost_price=500, sale_price=699, reorder_level=10),
    ]
    db.add_all(products)
    db.commit()
