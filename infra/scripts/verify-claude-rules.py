#!/usr/bin/env python3
"""
verify-claude-rules.py - Detecta si las reglas operativas criticas siguen en CLAUDE.md.

Las dos secciones "Modo de ejecucion (autonomia total)" y "Ciclo PR + merge a main"
se han perdido 2 veces tras pulls de main que reescribieron CLAUDE.md. Este script
verifica que ambas siguen presentes y avisa con un mensaje prominente si faltan.

Uso:
  python infra/scripts/verify-claude-rules.py            # exit 0 si OK, 1 si falta algo
  python infra/scripts/verify-claude-rules.py --silent   # solo exit code, sin output

Diseñado para invocarse desde el hook SessionStart de Claude Code en .claude/settings.json.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CLAUDE_MD = REPO_ROOT / "CLAUDE.md"

# Marcadores requeridos: titulo de seccion + frase ancla del cuerpo (caso falla detectada)
REQUIRED_SECTIONS = [
    {
        "title": "## Modo de ejecucion (autonomia total)",
        "anchor": "Pausa y confirma SOLO en estos 3 casos irreversibles",
        "memory_file": "feedback_autonomia_total.md",
        "supabase_id": "2a22619c-eb73-46b3-bd59-0bfc005b999f",
    },
    {
        "title": "## Ciclo PR + merge a main (automatico, sin esperar a Pablo)",
        "anchor": "gh pr merge <PR> --merge --delete-branch=false",
        "memory_file": "feedback_pr_merge_automatico.md",
        "supabase_id": "b3b5e61c-dc9f-48ff-9683-bb79e58f1eb7",
    },
]


def check() -> list[dict]:
    """Devuelve lista de secciones que faltan (vacia si todo OK)."""
    if not CLAUDE_MD.exists():
        return [{"title": "<archivo CLAUDE.md no existe>", "anchor": "", "memory_file": "", "supabase_id": ""}]

    content = CLAUDE_MD.read_text(encoding="utf-8")
    missing = []
    for section in REQUIRED_SECTIONS:
        if section["title"] not in content or section["anchor"] not in content:
            missing.append(section)
    return missing


def report(missing: list[dict], silent: bool) -> int:
    if not missing:
        if not silent:
            print(f"[verify-claude-rules] OK — las {len(REQUIRED_SECTIONS)} reglas operativas siguen en CLAUDE.md")
        return 0

    if silent:
        return 1

    print("=" * 78)
    print("AVISO: REGLAS OPERATIVAS PERDIDAS EN CLAUDE.md")
    print("=" * 78)
    print()
    print(f"Faltan {len(missing)} seccion(es) criticas que deben vivir en CLAUDE.md:")
    print()
    for s in missing:
        print(f"  - {s['title']}")
        print(f"    Memoria local: ~/.claude/projects/<proj>/memory/{s['memory_file']}")
        print(f"    Supabase agent_memories.id = {s['supabase_id']} (DIOS, importance 0.95)")
        print()
    print("Las reglas SIGUEN VIVAS en memorias locales y agent_memories Supabase,")
    print("pero CLAUDE.md es la fuente que se carga primero en cada sesion.")
    print()
    print("Acciones:")
    print("  1. Restaurar manualmente las secciones desde la memoria correspondiente")
    print("  2. Crear PR + merge a main (regla de PR/merge automatico)")
    print("  3. Si es la 3a vez, considerar auto-restore en este mismo script")
    print("=" * 78)
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--silent", action="store_true", help="Solo exit code, sin output")
    args = parser.parse_args()

    missing = check()
    return report(missing, args.silent)


if __name__ == "__main__":
    sys.exit(main())
