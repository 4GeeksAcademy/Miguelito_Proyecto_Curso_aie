"""Genera la muestra sintética de incidencias (sin datos reales).

Ejecución desde cualquier directorio:
    python data/generate_sample_incidents.py
"""

from __future__ import annotations

import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUTPUT = Path(__file__).with_name("incidents-HEALTHCORE.csv")
FIELDNAMES = [
    "incident_id",
    "created_at",
    "clinic_id",
    "category",
    "status",
    "priority",
    "customer_id",
    "customer_email",
    "resolved_at",
    "satisfaction_score",
    "description",
]

CATEGORY_COUNTS = [
    ("solicitud_cita", 30),
    ("fallo_facturacion", 22),
    ("queja_atencion", 18),
    ("fallo_operativo", 12),
    ("solicitud_documentacion", 10),
]
STATUS_COUNTS = [
    ("cerrado", 55),
    ("en_progreso", 20),
    ("abierto", 12),
    ("descartado", 5),
]


def expand_counts(counts: list[tuple[str, int]]) -> list[str]:
    return [value for value, count in counts for _ in range(count)]


def make_valid_rows() -> list[dict[str, str]]:
    categories = expand_counts(CATEGORY_COUNTS)
    statuses = expand_counts(STATUS_COUNTS)
    rows = []
    base = datetime(2026, 1, 1, 9, 0, tzinfo=timezone.utc)

    for index, (category, status) in enumerate(zip(categories, statuses), start=1):
        created = base + timedelta(hours=index * 7)
        resolved = ""
        if status == "cerrado":
            resolved = (created + timedelta(hours=2 + (index % 72))).isoformat()
        rows.append(
            {
                "incident_id": f"INC-{index:05d}",
                "created_at": created.isoformat(),
                "clinic_id": ("US-TX-01", "US-FL-01", "US-GA-01", "UK-LON-01", "UK-MAN-01")[index % 5],
                "category": category,
                "status": status,
                "priority": ("baja", "media", "alta", "critica")[index % 4],
                "customer_id": f"SYN-CUST-{index:05d}",
                "customer_email": f"customer{index:05d}@example.invalid",
                "resolved_at": resolved,
                "satisfaction_score": str(1 + ((index - 1) % 5)) if status == "cerrado" else "",
                "description": "Incidencia ficticia para pruebas; sin información personal ni clínica.",
            }
        )
    return rows


def make_invalid_rows(valid_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    invalid: list[dict[str, str]] = []

    def clone(index: int) -> dict[str, str]:
        row = valid_rows[index - 1].copy()
        # Mantener el ID como pista en el informe, salvo en pruebas de duplicado.
        row["incident_id"] = f"INC-{92 + len(invalid) + 1:05d}"
        return row

    row = clone(1)
    row["customer_id"] = ""
    invalid.append(row)  # campo obligatorio vacío

    row = clone(2)
    row["category"] = "categoria_desconocida"
    invalid.append(row)

    row = clone(3)
    row["status"] = "cancelada"
    invalid.append(row)

    row = clone(4)
    row["priority"] = "urgente"
    invalid.append(row)

    row = clone(5)
    row["created_at"] = "fecha-no-valida"
    invalid.append(row)

    row = clone(6)
    row["customer_email"] = "no-es-un-correo"
    invalid.append(row)

    row = clone(7)
    row["incident_id"] = valid_rows[0]["incident_id"]
    invalid.append(row)  # ID duplicado respecto de la primera fila válida

    row = clone(1)
    row["resolved_at"] = (datetime.fromisoformat(row["created_at"]) - timedelta(hours=1)).isoformat()
    invalid.append(row)  # resolución anterior a la creación

    return invalid


def main() -> None:
    valid_rows = make_valid_rows()
    rows = valid_rows + make_invalid_rows(valid_rows)
    with OUTPUT.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generados {len(rows)} registros sintéticos en {OUTPUT}")


if __name__ == "__main__":
    main()
