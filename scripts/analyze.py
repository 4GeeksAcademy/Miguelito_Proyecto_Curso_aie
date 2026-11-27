"""Entry point for the HealthCore incident analyzer CLI."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.incident_analyzer.analyzer import main


if __name__ == "__main__":
    arguments = sys.argv[1:]
    if arguments:
        input_path = Path(arguments[0])
        sample_path = ROOT / "data" / input_path.name
        if not input_path.exists() and not input_path.is_absolute() and sample_path.is_file():
            arguments[0] = str(sample_path)
    raise SystemExit(main(arguments))