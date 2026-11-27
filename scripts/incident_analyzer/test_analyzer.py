from __future__ import annotations

import io
from pathlib import Path

from scripts.incident_analyzer.analyzer import analyze_csv, write_aggregate_csv

ROOT = Path(__file__).resolve().parents[2]
SAMPLE = ROOT / "data" / "incidents-HEALTHCORE.csv"


def test_sample_matches_briefing_control_counts() -> None:
    result = analyze_csv(SAMPLE)
    assert result.total_read == 100
    assert result.valid_count == 92
    assert result.rejected_count == 8
    assert result.category_counts == {
        "solicitud_cita": 30,
        "fallo_facturacion": 22,
        "queja_atencion": 18,
        "fallo_operativo": 12,
        "solicitud_documentacion": 10,
    }
    assert result.status_counts == {
        "cerrado": 55,
        "en_progreso": 20,
        "abierto": 12,
        "descartado": 5,
    }
    assert result.resolved_count == 55
    assert result.resolution_rate_percent == 59.78
    assert result.mean_satisfaction_score == 3.0
    assert result.satisfaction_score_count == 55
    assert result.problem_counts == {
        "campo_obligatorio_vacio": 1,
        "categoria_invalida": 1,
        "estado_invalido": 1,
        "prioridad_invalida": 1,
        "fecha_creacion_invalida": 1,
        "email_invalido": 1,
        "incident_id_duplicado": 1,
        "fecha_resolucion_invalida": 1,
    }
    assert sum(result.jurisdiction_counts.values()) == 92
    assert set(result.jurisdiction_counts) == {"US", "UK"}
    assert set(result.priority_counts) == {"baja", "media", "alta", "critica"}


def test_rejection_details_do_not_leak_customer_data_or_description() -> None:
    result = analyze_csv(SAMPLE)
    serialized = str(result.to_dict())
    assert "@example.invalid" not in serialized
    assert "SYN-CUST" not in serialized
    assert "Incidencia ficticia" not in serialized
    assert [error["row"] for error in result.errors] == list(range(94, 102))
    assert result.errors[0]["reason"] == "campo obligatorio vacío: customer_id"
    assert result.errors[6]["reason"] == "incident_id duplicado"


def test_aggregate_csv_contains_metrics_but_no_pii() -> None:
    result = analyze_csv(SAMPLE)
    output = io.StringIO()
    write_aggregate_csv(result, output)
    content = output.getvalue()
    assert "customer_email" not in content
    assert "customer_id" not in content
    assert "description" not in content
    assert "59.78" in content
    assert "3.0" in content
    assert "jurisdiccion_UK," in content
    assert "jurisdiccion_US," in content
    assert content.splitlines()[0] == "metrica,valor"


def test_missing_resolved_at_rejects_closed_incident() -> None:
    data = io.StringIO(
        "incident_id,created_at,clinic_id,category,status,priority,customer_id,customer_email\n"
        "INC-90001,2026-01-01T00:00:00Z,US-TX-01,fallo_operativo,cerrado,alta,C1,c1@example.invalid\n"
    )
    result = analyze_csv(data)
    assert result.valid_count == 0
    assert result.rejected_count == 1
    assert "resolved_at obligatorio" in result.errors[0]["reason"]


def test_satisfaction_score_must_be_an_integer_from_one_to_five() -> None:
    header = "incident_id,created_at,clinic_id,category,status,priority,customer_id,customer_email,resolved_at,satisfaction_score\n"
    row = "INC-90011,2026-01-01T00:00:00Z,US-TX-01,fallo_operativo,cerrado,alta,C1,c1@example.invalid,2026-01-01T01:00:00Z,6\n"
    result = analyze_csv(io.StringIO(header + row))
    assert result.valid_count == 0
    assert "satisfaction_score debe ser un entero entre 1 y 5" in result.errors[0]["reason"]


def test_csv_can_be_read_as_stream_and_handles_duplicate_id() -> None:
    header = "incident_id,created_at,clinic_id,category,status,priority,customer_id,customer_email,resolved_at\n"
    row = "INC-90002,2026-01-01T00:00:00Z,UK-LON-01,solicitud_cita,abierto,baja,C2,c2@example.invalid,\n"
    result = analyze_csv(io.StringIO(header + row + row))
    assert result.total_read == 2
    assert result.valid_count == 1
    assert result.rejected_count == 1
    assert result.errors[0]["row"] == 3
    assert result.errors[0]["reason"] == "incident_id duplicado"


def test_rejections_can_be_streamed_without_retaining_them() -> None:
    header = "incident_id,created_at,clinic_id,category,status,priority,customer_id,customer_email\n"
    row = "INC-90003,2026-01-01T00:00:00Z,US-TX-01,fallo_operativo,abierto,alta,C3,invalid-email\n"
    streamed: list[dict[str, str | int | None]] = []
    result = analyze_csv(
        io.StringIO(header + row),
        collect_errors=False,
        error_handler=streamed.append,
    )
    assert result.rejected_count == 1
    assert result.errors == []
    assert streamed[0]["row"] == 2
    assert streamed[0]["reason"] == "formato inválido: customer_email"
