"""Mount the shared incident analyzer API under the services package."""

from scripts.incident_analyzer.api import app, create_app

__all__ = ["app", "create_app"]