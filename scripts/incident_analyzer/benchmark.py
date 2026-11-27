"""Benchmark streaming del analizador con un dataset sintético de gran tamaño.

Por defecto genera y procesa 1.000.000 de filas. El CSV sintético se guarda
momentáneamente en el directorio temporal del sistema y se elimina al terminar.
El benchmark no almacena los errores fila a fila ni escribe datos de entrada en
el informe.
"""

from __future__ import annotations

import argparse
import csv
import json
import resource
import tempfile
import time
import tracemalloc
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterator

from .analyzer import AnalysisResult, analyze_csv, write_aggregate_csv

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
# The current contract requires exactly five digits, allowing 100,000 distinct
# IDs (00000 through 99999). IDs intentionally repeat after that limit so the
# benchmark exercises duplicate rejection at one million input rows.
UNIQUE_IDS_IN_CONTRACT = 100_000
PII_SENTINEL = "BENCHMARK-PII-SENTINEL"
BASE_TIME = datetime(2026, 1, 1, 9, 0, tzinfo=timezone.utc)


def synthetic_rows(total: int) -> Iterator[dict[str, str]]:
    """Yield one synthetic row at a time; never build the whole dataset in RAM."""
    for zero_index in range(total):
        index = zero_index + 1
        incident_number = zero_index % UNIQUE_IDS_IN_CONTRACT
        created = BASE_TIME + timedelta(minutes=zero_index % (365 * 24 * 60))
        resolved = created + timedelta(hours=1 + zero_index % 48)
        yield {
            "incident_id": f"INC-{incident_number:05d}",
            "created_at": created.isoformat(),
            "clinic_id": "US-TX-01" if zero_index % 2 == 0 else "UK-LON-01",
            "category": (
                "solicitud_cita",
                "fallo_facturacion",
                "queja_atencion",
                "fallo_operativo",
                "solicitud_documentacion",
            )[zero_index % 5],
            "status": "cerrado",
            "priority": ("baja", "media", "alta", "critica")[zero_index % 4],
            "customer_id": f"{PII_SENTINEL}-CUSTOMER-{index:07d}",
            "customer_email": f"customer-{index:07d}@example.invalid",
            "resolved_at": resolved.isoformat(),
            "satisfaction_score": str(1 + (zero_index % 5)),
            "description": f"{PII_SENTINEL} descripción sintética {index:07d}",
        }


def write_synthetic_csv(path: Path, total: int) -> None:
    """Write generated rows incrementally to a temporary CSV fixture."""
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(synthetic_rows(total))


def peak_rss_megabytes() -> float:
    """Return process peak RSS in MiB (Linux reports KiB)."""
    peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    # Linux reports KiB; macOS reports bytes. This repo's benchmark targets Linux.
    return round(peak / 1024, 2)


def run_benchmark(total: int = 1_000_000) -> dict[str, object]:
    if total < 1:
        raise ValueError("El total de registros debe ser al menos 1.")

    started = time.perf_counter()
    tracemalloc.start()
    with tempfile.TemporaryDirectory(prefix="healthcore-incident-benchmark-") as temp_dir:
        source = Path(temp_dir) / "synthetic-incidents.csv"
        write_synthetic_csv(source, total)
        input_size_bytes = source.stat().st_size
        result = analyze_csv(source, collect_errors=False)
        aggregate = _aggregate_csv_text(result)
        # Inspect every output representation for sentinel data; customer fields
        # and descriptions are synthetic but must never escape aggregate reports.
        report = {
            "records_requested": total,
            "total_read": result.total_read,
            "valid_count": result.valid_count,
            "rejected_count": result.rejected_count,
            "resolution_rate_percent": result.resolution_rate_percent,
            "mean_resolution_hours": result.mean_resolution_hours,
            "jurisdiction_counts": dict(sorted(result.jurisdiction_counts.items())),
            "input_size_bytes": input_size_bytes,
            "aggregate_csv_bytes": len(aggregate.encode("utf-8")),
        }
        serialized_output = json.dumps(report, ensure_ascii=False) + aggregate
        if PII_SENTINEL in serialized_output or "@example.invalid" in serialized_output:
            raise RuntimeError("Fuga de dato sintético sensible detectada en la salida")
        if result.errors:
            raise RuntimeError("El modo benchmark acumuló errores en memoria")

    elapsed_seconds = time.perf_counter() - started
    _, peak_python_bytes = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    report["elapsed_seconds"] = round(elapsed_seconds, 3)
    report["rows_per_second"] = round(total / elapsed_seconds, 2) if elapsed_seconds else None
    report["peak_rss_megabytes"] = peak_rss_megabytes()
    report["peak_traced_python_megabytes"] = round(peak_python_bytes / (1024 * 1024), 2)
    report["pii_leak_check"] = "passed"
    report["temporary_input_removed"] = not source.exists()
    report["id_contract_note"] = (
        "El contrato INC-XXXXX admite como máximo 100.000 IDs únicos; a partir de ahí, "
        "las filas sintéticas se rechazan por duplicado."
    )
    return report


def _aggregate_csv_text(result: AnalysisResult) -> str:
    import io

    output = io.StringIO(newline="")
    write_aggregate_csv(result, output)
    return output.getvalue()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Benchmark de carga sintético del Analizador de Incidencias.")
    parser.add_argument("--records", type=int, default=1_000_000, help="Filas sintéticas (por defecto: 1.000.000)")
    parser.add_argument("--report", type=Path, help="Guardar el informe JSON minimizado en esta ruta")
    args = parser.parse_args(argv)
    report = run_benchmark(args.records)
    output = json.dumps(report, ensure_ascii=False, indent=2)
    print(output)
    if args.report:
        args.report.write_text(output + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
