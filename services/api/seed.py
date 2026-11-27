"""Load the initial synthetic HealthCore supplier directory into TinyDB."""

from models import SupplierCreate, utc_now_iso
from database import suppliers_table

INITIAL_SUPPLIERS = [
    {
        "name": "MedLine Clinical Supplies",
        "country": "USA",
        "categories": ["medical_supplies", "diagnostics"],
        "rate": 145.50,
        "status": "active",
    },
    {
        "name": "Thames Valley Pharma Ltd",
        "country": "UK",
        "categories": ["pharma", "medical_supplies"],
        "rate": 210.00,
        "status": "active",
    },
    {
        "name": "Apex Diagnostics Corp",
        "country": "USA",
        "categories": ["diagnostics"],
        "rate": 320.75,
        "status": "active",
    },
    {
        "name": "Britannia Health IT",
        "country": "UK",
        "categories": ["it_infrastructure", "ehr_services"],
        "rate": 480.00,
        "status": "active",
    },
    {
        "name": "Sunbelt Surgical & Lab",
        "country": "USA",
        "categories": ["medical_supplies"],
        "rate": 95.00,
        "status": "suspended",
    },
    {
        "name": "Albion BioLogistics",
        "country": "UK",
        "categories": ["pharma", "diagnostics"],
        "rate": 175.25,
        "status": "active",
    },
]


def main() -> None:
    """Insert missing initial suppliers; repeated runs do not create duplicates."""
    inserted_count = 0
    for supplier_data in INITIAL_SUPPLIERS:
        existing_supplier = suppliers_table.get(
            lambda record: record.get("name") == supplier_data["name"]
        )
        if existing_supplier is not None:
            continue

        supplier = SupplierCreate.model_validate(supplier_data)
        document_id = suppliers_table.insert(
            {**supplier.model_dump(mode="json"), "updated_at": utc_now_iso()}
        )
        # Persist the same integer identifier TinyDB assigned to this document.
        suppliers_table.update({"id": document_id}, doc_ids=[document_id])
        inserted_count += 1

    if inserted_count:
        print(f"Seed completado: {inserted_count} proveedores insertados.")
    else:
        print(
            "Seed completado: 0 proveedores insertados "
            "(la base de datos ya contiene registros)."
        )


if __name__ == "__main__":
    main()