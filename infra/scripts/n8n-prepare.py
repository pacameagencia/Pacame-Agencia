#!/usr/bin/env python3
"""
PACAME — Preparar workflows n8n para import.

Lee todos los JSONs en $WORKFLOWS_DIR, inyecta los campos requeridos por
n8n CLI (id, versionId, active, settings) y los guarda en $TMP_LOCAL.

Uso:
    WORKFLOWS_DIR=... TMP_LOCAL=... python n8n-prepare.py
"""
from __future__ import annotations
import json
import os
import sys
import uuid
from pathlib import Path


def main() -> int:
    src_dir = Path(os.environ["WORKFLOWS_DIR"])
    dst_dir = Path(os.environ["TMP_LOCAL"])
    dst_dir.mkdir(parents=True, exist_ok=True)

    for src in sorted(src_dir.glob("*.json")):
        slug = "pacame-" + src.stem
        with src.open("r", encoding="utf-8") as fp:
            data = json.load(fp)

        data["id"] = slug
        data["versionId"] = str(uuid.uuid4())
        data.setdefault("active", False)
        data.setdefault("settings", {"executionOrder": "v1"})

        # Cada nodo necesita un id string — si falta, lo generamos
        for i, node in enumerate(data.get("nodes", [])):
            if not node.get("id"):
                node["id"] = f"node_{i}"

        dst = dst_dir / src.name
        with dst.open("w", encoding="utf-8") as fp:
            json.dump(data, fp, ensure_ascii=False, indent=2)
        print(f"  prepared: {src.name}  (id={slug})")

    return 0


if __name__ == "__main__":
    sys.exit(main())
