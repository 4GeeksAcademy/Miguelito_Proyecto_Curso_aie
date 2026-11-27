# Incident Analyzer API

API REST para validar un CSV de incidencias y devolver métricas agregadas sin conservar el fichero subido.

## Instalación y ejecución

Desde la raíz del monorepo:

```bash
python -m pip install -r scripts/incident_analyzer/requirements.txt
uvicorn scripts.incident_analyzer.api:app --host 127.0.0.1 --port 8000
```

La ruta `POST /api/incidents/analyze` acepta `multipart/form-data` con un único fichero `.csv` en el campo `file`. El límite por defecto es 10 MiB. La respuesta incluye métricas, errores de calidad sin identificadores de cliente y el CSV agregado en `csv_download.content_base64`. `GET /api/incidents/results/export` descarga el CSV del último análisis como `results.csv`; devuelve 404 descriptivo antes del primer análisis. También puede iniciarse la misma aplicación con `uvicorn services.api.main:app`.

## Seguridad e integración

- En producción, integrar un middleware de autenticación corporativa que verifique credenciales y defina `request.state.authenticated_user_id` y `request.state.authenticated_role`. Los valores no deben proceder de encabezados del cliente ni de campos del formulario.
- Roles autorizados por defecto: `postventa` y `admin`; se pueden sustituir con `create_app(allowed_roles=...)`.
- `create_app(max_upload_bytes=...)` limita el tamaño del fichero. La app limita además la lectura del cuerpo multipart en streaming; configurar también límites equivalentes en proxy/servidor de despliegue.
- El multipart se analiza en memoria, sin `UploadFile`, temporales, persistencia ni registros del contenido. El MIME del part debe ser `text/csv`, `application/csv` o `application/vnd.ms-excel`.
- La auditoría registra timestamp UTC, principal autenticado, rol y cantidades procesadas/aceptadas/rechazadas. No registra IDs de incidencia, correos, IDs de cliente ni descripciones.
- `audit_writer` puede inyectarse para integrar un repositorio de auditoría protegido. El destino debe aplicar acceso restringido, retención y controles de integridad apropiados a cada jurisdicción.
- El score medio de satisfacción solo incluye filas válidas `cerrado` con `satisfaction_score` de 1 a 5. Errores de extensión/formato devuelven 422 y un fichero vacío devuelve 400.

Los headers `x-authenticated-*` no son una autenticación: la API no los acepta como fuente de identidad. La app requiere que un middleware de confianza del entorno establezca `request.state` antes de la ruta.