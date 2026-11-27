"""HealthCore API: incident analysis and supplier directory."""

from fastapi.middleware.cors import CORSMiddleware

from scripts.incident_analyzer.api import app, create_app

try:  # Package import from repository root.
	from .routes.suppliers import router as suppliers_router
except ImportError:  # Direct `uvicorn main:app` from services/api.
	from routes.suppliers import router as suppliers_router

app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000"],
	allow_origin_regex=r"https://.*\.app\.github\.dev",
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)
app.include_router(suppliers_router)

__all__ = ["app", "create_app"]