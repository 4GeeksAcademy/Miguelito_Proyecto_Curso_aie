"""Validación y métricas de CSV de incidencias con consumo acotado de memoria.

La lectura es fila a fila mediante el módulo csv estándar. No se conserva ninguna
columna de cliente o texto libre en resultados, logs o ficheros de salida.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Callable, TextIO

REQUIRED_FIELDS = (
    "incident_id",
    "created_at",
    "clinic_id",
    "category",
    "status",
    "priority",
    "customer_id",
    "customer_email",
)
OPTIONAL_FIELDS = ("resolved_at", "satisfaction_score", "description")
CATEGORIES = {
    "queja_atencion",
    "solicitud_cita",
    "solicitud_documentacion",
    "fallo_facturacion",
    "fallo_operativo",
}
STATUSES = {"abierto", "cerrado", "descartado", "en_progreso"}
PRIORITIES = {"baja", "media", "alta", "critica"}
INCIDENT_ID_RE = re.compile(r"^INC-\d{5}$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@dataclass
class AnalysisResult:
    total_read: int = 0
    valid_count: int = 0
    rejected_count: int = 0
    category_counts: Counter[str] = field(default_factory=Counter)
    status_counts: Counter[str] = field(default_factory=Counter)
    priority_counts: Counter[str] = field(default_factory=Counter)
    jurisdiction_counts: Counter[str] = field(default_factory=Counter)
    problem_counts: Counter[str] = field(default_factory=Counter)
    mean_resolution_hours: float | None = None
    mean_satisfaction_score: float | None = None
    satisfaction_score_count: int = 0
    resolution_rate_percent: float = 0.0
    resolved_count: int = 0
    errors: list[dict[str, str | int | None]] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        """Return JSON-friendly, deterministic metrics and quality errors."""
        return {
            "total_read": self.total_read,
            "valid_count": self.valid_count,
            "rejected_count": self.rejected_count,
            "category_counts": dict(sorted(self.category_counts.items())),
            "status_counts": dict(sorted(self.status_counts.items())),
            "priority_counts": dict(sorted(self.priority_counts.items())),
            "jurisdiction_counts": dict(sorted(self.jurisdiction_counts.items())),
            "problem_counts": dict(sorted(self.problem_counts.items())),
            "mean_resolution_hours": self.mean_resolution_hours,
            "mean_satisfaction_score": self.mean_satisfaction_score,
            "satisfaction_score_count": self.satisfaction_score_count,
            "resolution_rate_percent": self.resolution_rate_percent,
            "resolved_count": self.resolved_count,
            "errors": self.errors,
        }


def _parse_iso8601(value: str) -> datetime:
    """Parse an ISO 8601 date-time, including a trailing Z."""
    normalized = value.strip()
    if normalized.endswith(("Z", "z")):
        normalized = normalized[:-1] + "+00:00"
    parsed = datetime.fromisoformat(normalized)
    if "T" not in normalized and " " not in normalized:
        raise ValueError("se requiere fecha y hora ISO 8601")
    return parsed


def _elapsed_hours(start: datetime, end: datetime) -> float:
    """Subtract datetimes with consistent timezone handling."""
    if start.utcoffset() is None and end.utcoffset() is not None:
        start = start.replace(tzinfo=end.tzinfo)
    elif start.utcoffset() is not None and end.utcoffset() is None:
        end = end.replace(tzinfo=start.tzinfo)
    return (end - start).total_seconds() / 3600


def _validate_row(row: dict[str, str | None], seen_ids: set[str]) -> tuple[list[str], datetime | None, datetime | None]:
    reasons: list[str] = []
    incident_id = (row.get("incident_id") or "").strip()

    for field_name in REQUIRED_FIELDS:
        if not (row.get(field_name) or "").strip():
            reasons.append(f"campo obligatorio vacío: {field_name}")

    if incident_id:
        if not INCIDENT_ID_RE.fullmatch(incident_id):
            reasons.append("formato inválido: incident_id (esperado INC-XXXXX)")
        if incident_id in seen_ids:
            reasons.append("incident_id duplicado")
        else:
            # Reserve the first appearance even if some other field is invalid.
            seen_ids.add(incident_id)

    category = (row.get("category") or "").strip()
    if category and category not in CATEGORIES:
        reasons.append("category fuera de catálogo")
    status = (row.get("status") or "").strip()
    if status and status not in STATUSES:
        reasons.append("status fuera de catálogo")
    priority = (row.get("priority") or "").strip()
    if priority and priority not in PRIORITIES:
        reasons.append("priority fuera de catálogo")

    clinic_id = (row.get("clinic_id") or "").strip()
    if clinic_id and not (clinic_id.startswith("US-") or clinic_id.startswith("UK-")):
        reasons.append("clinic_id debe tener prefijo US- o UK-")

    email = (row.get("customer_email") or "").strip()
    if email and not EMAIL_RE.fullmatch(email):
        reasons.append("formato inválido: customer_email")

    created_at: datetime | None = None
    created_value = (row.get("created_at") or "").strip()
    if created_value:
        try:
            created_at = _parse_iso8601(created_value)
        except ValueError:
            reasons.append("fecha inválida: created_at (ISO 8601)")

    resolved_at: datetime | None = None
    resolved_value = (row.get("resolved_at") or "").strip()
    if status == "cerrado" and not resolved_value:
        reasons.append("resolved_at obligatorio para status cerrado")
    if resolved_value:
        try:
            resolved_at = _parse_iso8601(resolved_value)
        except ValueError:
            reasons.append("fecha inválida: resolved_at (ISO 8601)")
        if created_at and resolved_at and _elapsed_hours(created_at, resolved_at) < 0:
            reasons.append("resolved_at anterior a created_at")

    score_value = (row.get("satisfaction_score") or "").strip()
    if score_value:
        try:
            score = int(score_value)
            if str(score) != score_value or not 1 <= score <= 5:
                raise ValueError
        except ValueError:
            reasons.append("satisfaction_score debe ser un entero entre 1 y 5")

    return reasons, created_at, resolved_at


def analyze_csv(
    source: str | Path | TextIO,
    *,
    collect_errors: bool = True,
    error_handler: Callable[[dict[str, str | int | None]], None] | None = None,
) -> AnalysisResult:
    """Analyze CSV sequentially; only aggregate metrics, IDs and rejection reasons are retained.

    ``source`` may be a path or an already-open text stream. CSV data is never
    copied wholesale into memory. ``errors`` deliberately exclude email, customer
    ID and description. Set ``collect_errors=False`` and provide ``error_handler``
    to stream rejection details (for example JSONL) and keep memory bounded even
    when a large input contains many invalid rows.
    """
    close_stream = False
    if hasattr(source, "read"):
        stream = source  # type: ignore[assignment]
    else:
        stream = Path(source).open("r", encoding="utf-8-sig", newline="")
        close_stream = True

    result = AnalysisResult()
    seen_ids: set[str] = set()
    resolution_hours_sum = 0.0
    satisfaction_score_sum = 0
    try:
        reader = csv.DictReader(stream)
        if reader.fieldnames is None:
            raise ValueError("CSV vacío o sin encabezado")
        missing_headers = [name for name in REQUIRED_FIELDS if name not in reader.fieldnames]
        if missing_headers:
            raise ValueError("faltan columnas obligatorias en encabezado: " + ", ".join(missing_headers))

        for row_number, row in enumerate(reader, start=2):
            result.total_read += 1
            reasons, created_at, resolved_at = _validate_row(row, seen_ids)
            if reasons:
                result.rejected_count += 1
                error = {
                    "row": row_number,
                    "incident_id": ((row.get("incident_id") or "").strip() or None),
                    "reason": "; ".join(reasons),
                }
                if collect_errors:
                    result.errors.append(error)
                if error_handler:
                    error_handler(error)
                for reason in reasons:
                    result.problem_counts[_problem_type(reason)] += 1
                continue

            result.valid_count += 1
            category = (row.get("category") or "").strip()
            status = (row.get("status") or "").strip()
            priority = (row.get("priority") or "").strip()
            clinic_id = (row.get("clinic_id") or "").strip()
            result.category_counts[category] += 1
            result.status_counts[status] += 1
            result.priority_counts[priority] += 1
            result.jurisdiction_counts["US" if clinic_id.startswith("US-") else "UK"] += 1

            if status == "cerrado":
                result.resolved_count += 1
                # The validator guarantees both parsed values for resolved status.
                assert created_at is not None and resolved_at is not None
                resolution_hours_sum += _elapsed_hours(created_at, resolved_at)
                score_value = (row.get("satisfaction_score") or "").strip()
                if score_value:
                    satisfaction_score_sum += int(score_value)
                    result.satisfaction_score_count += 1

        result.resolution_rate_percent = (
            round(result.resolved_count / result.valid_count * 100, 2) if result.valid_count else 0.0
        )
        result.mean_resolution_hours = (
            round(resolution_hours_sum / result.resolved_count, 2) if result.resolved_count else None
        )
        result.mean_satisfaction_score = (
            round(satisfaction_score_sum / result.satisfaction_score_count, 2)
            if result.satisfaction_score_count
            else None
        )
        return result
    finally:
        if close_stream:
            stream.close()


def _problem_type(reason: str) -> str:
    """Return a stable category for a validation issue without exposing row data."""
    if reason.startswith("campo obligatorio"):
        return "campo_obligatorio_vacio"
    if "formato inválido: incident_id" in reason:
        return "incident_id_formato"
    if "duplicado" in reason:
        return "incident_id_duplicado"
    if "category" in reason:
        return "categoria_invalida"
    if "status" in reason:
        return "estado_invalido"
    if "priority" in reason:
        return "prioridad_invalida"
    if "clinic_id" in reason:
        return "clinica_invalida"
    if "customer_email" in reason:
        return "email_invalido"
    if "resolved_at" in reason:
        return "fecha_resolucion_invalida"
    if "created_at" in reason:
        return "fecha_creacion_invalida"
    if "satisfaction_score" in reason:
        return "satisfaction_score_invalido"
    return "otro"


def metric_rows(result: AnalysisResult) -> list[tuple[str, object]]:
    """Flatten all report metrics to the CLI/API CSV contract (metrica,valor)."""
    rows: list[tuple[str, object]] = [
        ("total_leidos", result.total_read),
        ("registros_validos", result.valid_count),
        ("registros_invalidos", result.rejected_count),
        ("tasa_resolucion_porcentaje", result.resolution_rate_percent),
        ("tiempo_medio_resolucion_horas", result.mean_resolution_hours or 0),
        ("indice_satisfaccion_medio", result.mean_satisfaction_score or 0),
        ("registros_con_satisfaccion", result.satisfaction_score_count),
    ]
    rows.extend((f"categoria_{key}", value) for key, value in sorted(result.category_counts.items()))
    rows.extend((f"estado_{key}", value) for key, value in sorted(result.status_counts.items()))
    rows.extend((f"prioridad_{key}", value) for key, value in sorted(result.priority_counts.items()))
    rows.extend((f"jurisdiccion_{key}", value) for key, value in sorted(result.jurisdiction_counts.items()))
    rows.extend((f"problema_{key}", value) for key, value in sorted(result.problem_counts.items()))
    return rows


def write_aggregate_csv(result: AnalysisResult, destination: str | Path | TextIO) -> None:
    """Write normalized aggregate rows without any identifier or free text."""
    close_stream = False
    if hasattr(destination, "write"):
        stream = destination  # type: ignore[assignment]
    else:
        stream = Path(destination).open("w", encoding="utf-8", newline="")
        close_stream = True
    try:
        writer = csv.writer(stream)
        writer.writerow(["metrica", "valor"])
        writer.writerows(metric_rows(result))
    finally:
        if close_stream:
            stream.close()


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Valida y analiza incidencias sin exponer PII.")
    parser.add_argument("input_csv", type=Path, help="Fichero CSV de incidencias")
    parser.add_argument("--json-out", type=Path, help="Ruta opcional para guardar el resumen JSON")
    parser.add_argument("--aggregate-csv", type=Path, help="Ruta opcional para exportar métricas agregadas")
    parser.add_argument(
        "--errors-jsonl",
        type=Path,
        help="Ruta opcional para transmitir rechazos en JSONL sin acumularlos en memoria",
    )
    args = parser.parse_args(argv)

    error_stream = args.errors_jsonl.open("w", encoding="utf-8") if args.errors_jsonl else None
    try:
        def write_error(error: dict[str, str | int | None]) -> None:
            assert error_stream is not None
            error_stream.write(json.dumps(error, ensure_ascii=False) + "\n")

        result = analyze_csv(
            args.input_csv,
            collect_errors=error_stream is None,
            error_handler=write_error if error_stream else None,
        )
    finally:
        if error_stream:
            error_stream.close()

    print_console_report(result)
    summary = json.dumps(result.to_dict(), ensure_ascii=False, indent=2)
    if args.json_out:
        args.json_out.write_text(summary + "\n", encoding="utf-8")
    if args.aggregate_csv:
        write_aggregate_csv(result, args.aggregate_csv)
    try:
        answer = input("¿Deseas exportar los resultados a CSV? [s / n] ").strip().lower()
    except EOFError:
        answer = "n"
    if answer == "s":
        write_aggregate_csv(result, Path("results.csv"))
        print("Resultados guardados en results.csv")
    return 0


def print_console_report(result: AnalysisResult) -> None:
    """Print a compact, aligned Spanish report, including issue-type breakdown."""
    print("=" * 64)
    print("ANÁLISIS DE INCIDENCIAS HEALTHCORE")
    print("=" * 64)
    metrics = [
        ("Total de registros leídos", result.total_read),
        ("Registros válidos", result.valid_count),
        ("Registros inválidos", result.rejected_count),
        ("Tasa de resolución", f"{result.resolution_rate_percent:.2f}%"),
        ("Tiempo medio de resolución", f"{result.mean_resolution_hours:.2f} h" if result.mean_resolution_hours is not None else "N/D"),
        ("Índice de satisfacción medio", f"{result.mean_satisfaction_score:.2f}" if result.mean_satisfaction_score is not None else "N/D"),
    ]
    for label, value in metrics:
        print(f"{label:<38} {value:>20}")
    for title, counts in (
        ("POR CATEGORÍA", result.category_counts),
        ("POR ESTADO", result.status_counts),
        ("REGISTROS INVÁLIDOS POR TIPO", result.problem_counts),
    ):
        print("-" * 64)
        print(title)
        if not counts:
            print("  (sin registros)")
        for label, count in sorted(counts.items()):
            print(f"{label:<38} {count:>20}")
    print("=" * 64)


if __name__ == "__main__":
    sys.exit(main())
