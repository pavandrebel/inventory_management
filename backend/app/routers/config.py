from fastapi import APIRouter

from app.config import get_app_config
from app.schemas import AppConfigResponse

router = APIRouter(prefix="/config", tags=["config"])


@router.get("", response_model=AppConfigResponse)
def get_config():
    config = get_app_config()
    return AppConfigResponse(
        app=config.get("app", {}),
        features=config.get("features", {}),
        roles=config.get("roles", []),
        order_statuses=config.get("order_statuses", {}),
        stock=config.get("stock", {}),
    )
