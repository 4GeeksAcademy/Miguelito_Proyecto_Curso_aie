"""FastAPI endpoint for privacy-conscious in-memory incident CSV analysis.

    A trusted authentication middleware must set ``request.state.authenticated_user_id``
    and ``request.state.authenticated_role``. The endpoint does not persist uploads or
    log their contents. Multipart parsing is performed from a size-bounded in-memory
    body to avoid UploadFile's disk-spooling behavior. Deployments should also configure
    a server/proxy body-size limit because ASGI servers may buffer before app code.
"""

from __future__ import annotations

import base64
import csv
import io
import json
import logging
import re
from datetime import datetime, timezone
from email import policy
from email.parser import BytesParser
from typing import Callable

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

from .analyzer import AnalysisResult, analyze_csv, write_aggregate_csv

DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_FILE_MIME_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
}
PRINCIPAL_RE = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")
DEFAULT_ALLOWED_ROLES = {"postventa", "admin"}
MAX_MULTIPART_OVERHEAD_BYTES = 64 * 1024
AUDIT_LOGGER = logging.getLogger("healthcore.incident_analyzer.audit")
AuditWriter = Callable[[dict[str, object]], None]


def _audit_log(event: dict[str, object]) -> None:
    """Emit an allowlisted audit event; never pass upload data to the logger."""
    AUDIT_LOGGER.info("incident_analysis %s", json.dumps(event, ensure_ascii=True, sort_keys=True))


class RequestBodyLimitMiddleware:
    """Reject oversized ASGI request bodies before buffering them in the application."""

    def __init__(self, app: object, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: dict[str, object], receive: object, send: object) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        declared = headers.get(b"content-length")
        max_body = self.max_bytes + MAX_MULTIPART_OVERHEAD_BYTES
        if declared:
            try:
                if int(declared) > max_body:
                    await _send_too_large(send)
                    return
            except ValueError:
                await _send_bad_content_length(send)
                return

        received = 0

        async def limited_receive() -> dict[str, object]:
            nonlocal received
            message = await receive()
            if message.get("type") == "http.request":
                received += len(message.get("body", b""))
                if received > max_body:
                    raise _RequestBodyTooLarge
            return message

        try:
            await self.app(scope, limited_receive, send)
        except _RequestBodyTooLarge:
            await _send_too_large(send)


class _RequestBodyTooLarge(Exception):
    pass


async def _send_too_large(send: object) -> None:
    body = b'{"detail":"El fichero supera el l\\u00edmite de tama\\u00f1o."}'
    await send({"type": "http.response.start", "status": 413, "headers": [(b"content-type", b"application/json")]})
    await send({"type": "http.response.body", "body": body})


async def _send_bad_content_length(send: object) -> None:
    body = b'{"detail":"Content-Length inv\\u00e1lido."}'
    await send({"type": "http.response.start", "status": 400, "headers": [(b"content-type", b"application/json")]})
    await send({"type": "http.response.body", "body": body})


def _parse_upload(body: bytes, content_type: str) -> tuple[str, str, bytes]:
    """Extract one `file` multipart part without writing to disk."""
    if not content_type.lower().startswith("multipart/form-data"):
        raise ValueError("Se requiere multipart/form-data.")
    try:
        envelope = (
            f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("ascii") + body
        )
    except UnicodeEncodeError as exc:
        raise ValueError("Content-Type multipart inválido.") from exc
    message = BytesParser(policy=policy.default).parsebytes(envelope)
    if not message.is_multipart():
        raise ValueError("Formulario multipart inválido.")

    files: list[tuple[str, str, bytes]] = []
    for part in message.iter_parts():
        if part.get_content_disposition() != "form-data":
            continue
        if part.get_param("name", header="content-disposition") != "file":
            continue
        filename = part.get_filename()
        if filename is None:
            continue
        payload = part.get_payload(decode=True)
        if payload is None:
            raise ValueError("No se pudo leer el fichero cargado.")
        files.append((filename, part.get_content_type().lower(), payload))

    if len(files) != 1:
        raise ValueError("El formulario debe incluir exactamente un fichero en el campo 'file'.")
    return files[0]


def _build_response(result: AnalysisResult) -> dict[str, object]:
    csv_buffer = io.StringIO(newline="")
    write_aggregate_csv(result, csv_buffer)
    csv_bytes = csv_buffer.getvalue().encode("utf-8")
    # Error output intentionally omits incident IDs; row number and fixed reason suffice.
    errors = [{"row": error["row"], "reason": error["reason"]} for error in result.errors]
    return {
        "metrics": {
            "total_read": result.total_read,
            "valid_count": result.valid_count,
            "rejected_count": result.rejected_count,
            "category_counts": dict(sorted(result.category_counts.items())),
            "status_counts": dict(sorted(result.status_counts.items())),
            "priority_counts": dict(sorted(result.priority_counts.items())),
            "jurisdiction_counts": dict(sorted(result.jurisdiction_counts.items())),
            "problem_counts": dict(sorted(result.problem_counts.items())),
            "mean_resolution_hours": result.mean_resolution_hours,
            "mean_satisfaction_score": result.mean_satisfaction_score,
            "satisfaction_score_count": result.satisfaction_score_count,
            "resolution_rate_percent": result.resolution_rate_percent,
            "resolved_count": result.resolved_count,
        },
        "errors": errors,
        "csv_download": {
            "filename": "incident-analysis-summary.csv",
            "content_type": "text/csv; charset=utf-8",
            "content_base64": base64.b64encode(csv_bytes).decode("ascii"),
        },
    }


def create_app(
    *,
    max_upload_bytes: int = DEFAULT_MAX_UPLOAD_BYTES,
    allowed_roles: set[str] | None = None,
    audit_writer: AuditWriter | None = None,
) -> FastAPI:
    """Create the API app; injection points support controlled deployments and tests."""
    if max_upload_bytes <= 0:
        raise ValueError("max_upload_bytes debe ser positivo")
    roles = {role.lower() for role in (allowed_roles or DEFAULT_ALLOWED_ROLES)}
    write_audit = audit_writer or _audit_log
    app = FastAPI(
        title="HealthCore Incident Analyzer API",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    app.state.max_request_body_bytes = max_upload_bytes
    app.state.latest_analysis_csv = None
    app.add_middleware(RequestBodyLimitMiddleware, max_bytes=max_upload_bytes)

    @app.post("/api/incidents/analyze")
    async def analyze_incidents(request: Request) -> JSONResponse:
        # Authentication middleware must set this server-side after verifying
        # credentials. Never trust identity/role values sent as client headers.
        principal = getattr(request.state, "authenticated_user_id", "")
        role = getattr(request.state, "authenticated_role", "").lower()
        if not PRINCIPAL_RE.fullmatch(principal) or "@" in principal:
            return JSONResponse({"detail": "Identidad autenticada requerida."}, status_code=401)
        if role not in roles:
            return JSONResponse({"detail": "Rol no autorizado."}, status_code=403)

        content_length = request.headers.get("content-length")
        max_body_bytes = max_upload_bytes + MAX_MULTIPART_OVERHEAD_BYTES
        if content_length:
            try:
                declared_length = int(content_length)
            except ValueError:
                return JSONResponse({"detail": "Content-Length inválido."}, status_code=400)
            if declared_length > max_body_bytes:
                return JSONResponse({"detail": "El fichero supera el límite de tamaño."}, status_code=413)

        body = bytearray()
        async for chunk in request.stream():
            if len(body) + len(chunk) > max_body_bytes:
                # Drop references immediately; no temporary upload is created.
                body.clear()
                return JSONResponse({"detail": "El fichero supera el límite de tamaño."}, status_code=413)
            body.extend(chunk)

        try:
            filename, file_mime, file_bytes = _parse_upload(
                bytes(body), request.headers.get("content-type", "")
            )
        except ValueError as exc:
            body.clear()
            return JSONResponse({"detail": str(exc)}, status_code=400)
        body.clear()

        if not filename.lower().endswith(".csv"):
            return JSONResponse({"detail": "La extensión del fichero debe ser .csv."}, status_code=422)
        if len(file_bytes) > max_upload_bytes:
            return JSONResponse({"detail": "El fichero supera el límite de tamaño."}, status_code=413)

        if file_mime not in ALLOWED_FILE_MIME_TYPES:
            return JSONResponse({"detail": "El formato del fichero debe ser CSV (text/csv)."}, status_code=422)
        if not file_bytes:
            return JSONResponse({"detail": "El fichero CSV está vacío."}, status_code=400)

        try:
            csv_text = file_bytes.decode("utf-8-sig", errors="strict")
        except UnicodeDecodeError:
            return JSONResponse({"detail": "El CSV debe estar codificado en UTF-8."}, status_code=400)

        try:
            result = analyze_csv(io.StringIO(csv_text))
        except (csv.Error, ValueError) as exc:
            # Only fixed parser/header errors are returned; never include raw input values.
            message = str(exc)
            if message.startswith("faltan columnas obligatorias en encabezado:"):
                safe_message = message
            elif message == "CSV vacío o sin encabezado":
                safe_message = message
            else:
                safe_message = "No se pudo analizar el CSV por un error de estructura."
            return JSONResponse({"detail": safe_message}, status_code=422)
        finally:
            # Release references to decoded data as soon as aggregation finishes.
            csv_text = ""
            file_bytes = b""

        write_audit(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": "incident_csv_analyzed",
                "requester_id": principal,
                "requester_role": role,
                "total_processed": result.total_read,
                "valid_count": result.valid_count,
                "rejected_count": result.rejected_count,
            }
        )
        export_buffer = io.StringIO(newline="")
        write_aggregate_csv(result, export_buffer)
        app.state.latest_analysis_csv = export_buffer.getvalue().encode("utf-8")
        response = _build_response(result)
        result.errors.clear()
        return JSONResponse(response)

    @app.get("/api/incidents/results/export")
    async def export_latest_results() -> Response:
        csv_bytes = app.state.latest_analysis_csv
        if csv_bytes is None:
            return JSONResponse(
                {"detail": "Aún no hay un análisis disponible para exportar."},
                status_code=404,
            )
        return Response(
            content=csv_bytes,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": 'attachment; filename="results.csv"'},
        )

    return app


app = create_app()
