from __future__ import annotations

import base64
from pathlib import Path

from fastapi.testclient import TestClient

from scripts.incident_analyzer.api import create_app

ROOT = Path(__file__).resolve().parents[2]
SAMPLE = ROOT / "data" / "incidents-HEALTHCORE.csv"


def multipart_body(
    payload: bytes,
    *,
    filename: str = "incidents.csv",
    file_mime: str = "text/csv",
    boundary: str = "test-boundary",
) -> tuple[bytes, str]:
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: {file_mime}\r\n\r\n"
    ).encode() + payload + f"\r\n--{boundary}--\r\n".encode()
    return body, f"multipart/form-data; boundary={boundary}"


def authorized_client(app: object, role: str = "postventa") -> TestClient:
    # Simulate trusted auth middleware: identity is set on request.state, never from user headers.
    @app.middleware("http")
    async def set_identity(request: object, call_next: object) -> object:
        request.state.authenticated_user_id = "user-123"
        request.state.authenticated_role = role
        return await call_next(request)

    return TestClient(app)


def test_endpoint_returns_metrics_errors_download_and_pii_free_audit() -> None:
    audit_events: list[dict[str, object]] = []
    app = create_app(audit_writer=audit_events.append)
    client = authorized_client(app)
    payload, content_type = multipart_body(SAMPLE.read_bytes())
    response = client.post(
        "/api/incidents/analyze",
        content=payload,
        headers={"content-type": content_type},
    )

    assert response.status_code == 200
    result = response.json()
    metrics = result["metrics"]
    assert (metrics["total_read"], metrics["valid_count"], metrics["rejected_count"]) == (100, 92, 8)
    assert metrics["resolution_rate_percent"] == 59.78
    assert metrics["mean_satisfaction_score"] == 3.0
    assert metrics["satisfaction_score_count"] == 55
    assert len(result["errors"]) == 8
    assert set(result["errors"][0]) == {"row", "reason"}
    download = result["csv_download"]
    decoded_csv = base64.b64decode(download["content_base64"]).decode()
    assert download["filename"] == "incident-analysis-summary.csv"
    assert "@example.invalid" not in decoded_csv
    assert "customer_id" not in decoded_csv
    assert "59.78" in decoded_csv
    assert "indice_satisfaccion_medio,3.0" in decoded_csv
    assert decoded_csv.splitlines()[0] == "metrica,valor"

    exported = client.get("/api/incidents/results/export")
    assert exported.status_code == 200
    assert exported.headers["content-disposition"] == 'attachment; filename="results.csv"'
    assert exported.content == base64.b64decode(download["content_base64"])

    assert len(audit_events) == 1
    audit = audit_events[0]
    assert audit["requester_id"] == "user-123"
    assert audit["requester_role"] == "postventa"
    assert (audit["total_processed"], audit["valid_count"], audit["rejected_count"]) == (100, 92, 8)
    assert set(audit) == {
        "timestamp", "event", "requester_id", "requester_role",
        "total_processed", "valid_count", "rejected_count",
    }
    assert "@example.invalid" not in str(audit)
    assert "SYN-CUST" not in str(audit)


def test_unauthenticated_and_unauthorized_requests_are_rejected() -> None:
    app = create_app()
    client = TestClient(app)
    response = client.post("/api/incidents/analyze", headers={"x-authenticated-user-id": "user-123", "x-authenticated-role": "postventa"})
    assert response.status_code == 401

    app = create_app()
    client = authorized_client(app, role="clinician")
    response = client.post("/api/incidents/analyze")
    assert response.status_code == 403


def test_extension_and_file_mime_are_validated() -> None:
    app = create_app()
    client = authorized_client(app)
    csv_data = b"incident_id,created_at,clinic_id,category,status,priority,customer_id,customer_email\n"

    body, content_type = multipart_body(csv_data, filename="incidents.txt")
    response = client.post("/api/incidents/analyze", content=body, headers={"content-type": content_type})
    assert response.status_code == 422

    body, content_type = multipart_body(csv_data, file_mime="application/octet-stream")
    response = client.post("/api/incidents/analyze", content=body, headers={"content-type": content_type})
    assert response.status_code == 422


def test_empty_file_and_export_before_analysis_have_descriptive_errors() -> None:
    client = authorized_client(create_app())
    export = client.get("/api/incidents/results/export")
    assert export.status_code == 404
    assert "Aún no hay un análisis" in export.json()["detail"]
    body, content_type = multipart_body(b"")
    response = client.post("/api/incidents/analyze", content=body, headers={"content-type": content_type})
    assert response.status_code == 400
    assert "vacío" in response.json()["detail"]


def test_upload_limit_is_enforced_without_content_length() -> None:
    app = create_app(max_upload_bytes=128)
    client = authorized_client(app)
    body, content_type = multipart_body(b"x" * 256)
    response = client.post(
        "/api/incidents/analyze",
        content=body,
        headers={"content-type": content_type},
    )
    assert response.status_code == 413


def test_client_supplied_identity_headers_are_not_trusted() -> None:
    app = create_app()
    client = TestClient(app)
    payload, content_type = multipart_body(SAMPLE.read_bytes())
    response = client.post(
        "/api/incidents/analyze",
        content=payload,
        headers={
            "content-type": content_type,
            "x-authenticated-user-id": "attacker",
            "x-authenticated-role": "admin",
        },
    )
    assert response.status_code == 401
