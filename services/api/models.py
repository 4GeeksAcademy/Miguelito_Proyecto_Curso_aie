"""Pydantic contracts for the HealthCore supplier directory."""

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


VALID_SUPPLIER_CATEGORIES = {
    "medical_supplies",
    "pharma",
    "diagnostics",
    "it_infrastructure",
    "ehr_services",
}


def utc_now_iso() -> str:
    """Return a timezone-aware ISO 8601 timestamp in UTC."""
    return datetime.now(timezone.utc).isoformat()


class SupplierCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)
    country: str = Field(min_length=1)
    categories: list[str] = Field(min_length=1)
    rate: float = Field(gt=0)
    status: SupplierStatus = SupplierStatus.ACTIVE

    @field_validator("name", "country")
    @classmethod
    def reject_whitespace_only(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be empty")
        return value

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, categories: list[str]) -> list[str]:
        invalid = sorted(set(categories) - VALID_SUPPLIER_CATEGORIES)
        if invalid:
            raise ValueError(f"unsupported supplier categories: {', '.join(invalid)}")
        return categories


class SupplierRateUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rate: float = Field(gt=0)


class SupplierStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: SupplierStatus


class SupplierResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    name: str
    country: str
    categories: list[str]
    rate: float
    status: SupplierStatus
    updated_at: str = Field(default_factory=utc_now_iso)