#!/usr/bin/env python3
"""Aplica migraciones SQL a Supabase Postgres.

Uso:
  # opcion A (recomendado): DATABASE_URL en entorno
  DATABASE_URL="postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres" \
      python apply-migration.py infra/migrations/004_neural_network.sql

  # opcion B: Supabase Management API Token (Personal Access Token)
  SUPABASE_ACCESS_TOKEN="sbp_..." SUPABASE_PROJECT_REF="kfmnllpscheodgxnutkw" \
      python apply-migration.py infra/migrations/004_neural_network.sql
"""
import os
import sys
import json
from pathlib import Path

def apply_via_pg(sql: str) -> None:
    import psycopg2
    url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        print("[OK] Migracion aplicada via postgres.")
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] {e}", file=sys.stderr)
        raise
    finally:
        conn.close()

def apply_via_management_api(sql: str) -> None:
    import urllib.request
    token = os.environ["SUPABASE_ACCESS_TOKEN"]
    ref = os.environ.get("SUPABASE_PROJECT_REF", "kfmnllpscheodgxnutkw")
    url = f"https://api.supabase.com/v1/projects/{ref}/database/query"
    req = urllib.request.Request(
        url,
        data=json.dumps({"query": sql}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode()
            print(f"[OK] Migracion aplicada via Management API.")
            print(body[:500])
    except urllib.error.HTTPError as e:
        print(f"[ERROR HTTP {e.code}] {e.read().decode()}", file=sys.stderr)
        raise

def main() -> int:
    if len(sys.argv) < 2:
        print("Uso: python apply-migration.py <archivo.sql> [<archivo2.sql> ...]", file=sys.stderr)
        return 2

    for path in sys.argv[1:]:
        sql = Path(path).read_text(encoding="utf-8")
        print(f"\n== Aplicando {path} ({len(sql)} bytes) ==")
        if os.environ.get("DATABASE_URL"):
            apply_via_pg(sql)
        elif os.environ.get("SUPABASE_ACCESS_TOKEN"):
            apply_via_management_api(sql)
        else:
            print("[ERROR] Define DATABASE_URL o SUPABASE_ACCESS_TOKEN.", file=sys.stderr)
            return 3
    return 0

if __name__ == "__main__":
    sys.exit(main())
