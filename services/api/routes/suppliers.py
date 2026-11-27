"""CRUD endpoints for the HealthCore supplier directory."""

from fastapi import APIRouter, HTTPException, Query, Response, status
from tinydb.table import Document

try:  # Support `services.api.main` imports from the repository root.
    from ..database import suppliers_table
    from ..models import (
        SupplierCreate,
        SupplierRateUpdate,
        SupplierResponse,
        SupplierStatusUpdate,
        utc_now_iso,
    )
except ImportError:  # Support `main:app` when uvicorn runs in services/api.
    from database import suppliers_table
    from models import (
        SupplierCreate,
        SupplierRateUpdate,
        SupplierResponse,
        SupplierStatusUpdate,
        utc_now_iso,
    )

router = APIRouter(tags=["suppliers"])


def _response(document: Document) -> SupplierResponse:
    """Convert a TinyDB document into the public response model."""
    payload = dict(document)
    payload["id"] = int(document.doc_id)
    return SupplierResponse.model_validate(payload)


def _get_supplier(supplier_id: int) -> Document:
    document = suppliers_table.get(doc_id=supplier_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return document


@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier_data: SupplierCreate) -> SupplierResponse:
    """Validate and persist a new supplier."""
    payload = supplier_data.model_dump(mode="json")
    payload["updated_at"] = utc_now_iso()
    document_id = suppliers_table.insert(payload)
    document = suppliers_table.get(doc_id=document_id)
    assert document is not None  # TinyDB returns the document after a successful insert.
    return _response(document)


@router.get("/suppliers", response_model=list[SupplierResponse])
def list_suppliers(
    country: str | None = Query(default=None),
    category: str | None = Query(default=None),
) -> list[SupplierResponse]:
    """List suppliers, optionally filtered by country and/or category."""
    country_filter = country.casefold() if country is not None else None
    category_filter = category.casefold() if category is not None else None
    results = []

    for document in suppliers_table:
        if country_filter is not None and document.get("country", "").casefold() != country_filter:
            continue
        categories = document.get("categories", [])
        if category_filter is not None and not any(
            item.casefold() == category_filter for item in categories
        ):
            continue
        results.append(_response(document))

    return results


@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int) -> SupplierResponse:
    """Return one supplier by its TinyDB document ID."""
    return _response(_get_supplier(supplier_id))


@router.patch("/suppliers/{supplier_id}/rate", response_model=SupplierResponse)
def update_supplier_rate(
    supplier_id: int, rate_update: SupplierRateUpdate
) -> SupplierResponse:
    """Update a supplier's positive base rate and modification timestamp."""
    _get_supplier(supplier_id)
    suppliers_table.update(
        {"rate": rate_update.rate, "updated_at": utc_now_iso()},
        doc_ids=[supplier_id],
    )
    return _response(_get_supplier(supplier_id))


@router.patch("/suppliers/{supplier_id}/status", response_model=SupplierResponse)
def update_supplier_status(
    supplier_id: int, status_update: SupplierStatusUpdate
) -> SupplierResponse:
    """Update a supplier's status and modification timestamp."""
    _get_supplier(supplier_id)
    suppliers_table.update(
        {"status": status_update.status.value, "updated_at": utc_now_iso()},
        doc_ids=[supplier_id],
    )
    return _response(_get_supplier(supplier_id))


@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int) -> Response:
    """Delete a supplier; return 404 when the TinyDB document ID is absent."""
    _get_supplier(supplier_id)
    suppliers_table.remove(doc_ids=[supplier_id])
    return Response(status_code=status.HTTP_204_NO_CONTENT)