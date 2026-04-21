"""Apply a .sql seed file directly to Supabase Postgres via DATABASE_URL."""
import os
import sys
import re
from pathlib import Path

import psycopg2

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT.parent.parent.parent / "web" / ".env.local"

# Load DATABASE_URL from .env.local
env = {}
with open(ENV_FILE, "r", encoding="utf-8") as f:
    for line in f:
        match = re.match(r"^([A-Z_]+)=(.*)$", line.strip())
        if match:
            env[match.group(1)] = match.group(2)

DATABASE_URL = env.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not in .env.local", file=sys.stderr)
    sys.exit(1)

# Accept seed path as arg
if len(sys.argv) < 2:
    print("Usage: apply-seed.py <seed.sql>", file=sys.stderr)
    sys.exit(1)

seed_path = Path(sys.argv[1])
if not seed_path.is_absolute():
    seed_path = ROOT / seed_path
sql = seed_path.read_text(encoding="utf-8")

print(f"Applying seed: {seed_path.name}")
print(f"Size: {len(sql)} chars, {len(sql.splitlines())} lines")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
try:
    with conn.cursor() as cur:
        cur.execute(sql)
        # Report what changed
        try:
            table = re.search(r"INSERT INTO (\w+)", sql)
            if table:
                cur.execute(f"SELECT COUNT(*) FROM {table.group(1)}")
                row = cur.fetchone()
                print(f"Rows in {table.group(1)}: {row[0]}")
        except Exception as e:
            print(f"Count query failed: {e}")
    print("OK")
finally:
    conn.close()
