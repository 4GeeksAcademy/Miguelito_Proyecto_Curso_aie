"""Persistent TinyDB storage for HealthCore supplier records."""

from pathlib import Path

from tinydb import Query, TinyDB

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_PATH = DATA_DIR / "suppliers.json"

db = TinyDB(DATABASE_PATH, indent=2, ensure_ascii=False)
suppliers_table = db.table("suppliers")
SupplierQuery = Query


def close_database() -> None:
    """Close the TinyDB storage handle."""
    db.close()