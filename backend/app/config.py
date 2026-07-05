from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Inventory Management"
    app_company: str = "Your Company Name"
    app_primary_color: str = "#2563eb"
    app_currency: str = "INR"
    app_timezone: str = "Asia/Kolkata"

    database_url: str = "postgresql://inventory:change_me_secure_password@localhost:5432/inventory_db"
    secret_key: str = "change_me_to_a_long_random_secret_key"
    access_token_expire_minutes: int = 480
    cors_origins: str = "http://localhost:3000"

    feature_barcode: bool = True
    feature_purchase_orders: bool = True
    feature_sales_orders: bool = True
    feature_reports: bool = True
    feature_multi_location: bool = True

    config_path: str = "/app/config/app.config.yaml"

    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


def _load_yaml_config(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def _apply_env_overrides(yaml_config: dict[str, Any], settings: Settings) -> dict[str, Any]:
    app_cfg = yaml_config.setdefault("app", {})
    features = yaml_config.setdefault("features", {})

    app_cfg["name"] = settings.app_name
    app_cfg["company"] = settings.app_company
    app_cfg["primary_color"] = settings.app_primary_color
    app_cfg["currency"] = settings.app_currency
    app_cfg["timezone"] = settings.app_timezone

    features["barcode"] = settings.feature_barcode
    features["purchase_orders"] = settings.feature_purchase_orders
    features["sales_orders"] = settings.feature_sales_orders
    features["reports"] = settings.feature_reports
    features["multi_location"] = settings.feature_multi_location

    return yaml_config


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_app_config() -> dict[str, Any]:
    settings = get_settings()
    local_path = Path(__file__).resolve().parents[2] / "config" / "app.config.yaml"
    config_path = Path(settings.config_path) if Path(settings.config_path).exists() else local_path
    yaml_config = _load_yaml_config(config_path)
    return _apply_env_overrides(yaml_config, settings)
