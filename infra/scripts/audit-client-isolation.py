#!/usr/bin/env python3
"""
audit-client-isolation.py — Auditoría de aislamiento de datos cliente en PACAME.

Escanea el vault PacameCueva, el repo PACAME y opcionalmente Supabase para detectar:
1. Secrets expuestos (API keys, passwords, tokens, connection strings).
2. Cross-references entre clientes (notas que mezclan clientes diferentes).
3. Memorias en agent_memories sin tag de cliente cuando deberían tenerlo.
4. Datos de clientes Capa 4 (La Caleta, Ecomglobalbox) en contextos PACAME públicos.

Uso:
  python infra/scripts/audit-client-isolation.py
  python infra/scripts/audit-client-isolation.py --scan-vault     # solo vault
  python infra/scripts/audit-client-isolation.py --scan-repo      # solo repo
  python infra/scripts/audit-client-isolation.py --json           # output JSON
  python infra/scripts/audit-client-isolation.py --strict         # exit 1 si hay críticos

Exit codes:
  0 — sin issues críticos
  1 — críticos detectados
  2 — error de ejecución
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

# Windows: forzar utf-8 para que emojis no peten en cp1252
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Iterator

REPO_ROOT = Path(__file__).resolve().parents[2]
VAULT = REPO_ROOT / "PacameCueva"
CLIENTS_DIR = REPO_ROOT / "clients"

# Clientes conocidos por slug (de MEMORY.md + clients/)
KNOWN_CLIENTS = ["royo", "talleresjaula", "ecomglobalbox", "casa-marisol"]
# Capa 4 (entidades aparte que NO deben aparecer en context PACAME público)
CAPA_4_ENTIDADES = ["caleta", "la-caleta", "ecomglobalbox"]

# Patrones de secrets — cada uno: (label, regex, severity)
SECRET_PATTERNS: list[tuple[str, str, str]] = [
    ("Stripe live secret", r"sk_live_[A-Za-z0-9]{20,}", "critical"),
    ("Stripe test secret", r"sk_test_[A-Za-z0-9]{20,}", "high"),
    ("Stripe publishable live", r"pk_live_[A-Za-z0-9]{20,}", "medium"),
    ("Stripe webhook secret", r"whsec_[A-Za-z0-9]{30,}", "high"),
    ("GitHub PAT classic", r"gh[ps]_[A-Za-z0-9]{36,}", "critical"),
    ("GitHub fine-grained", r"github_pat_[A-Za-z0-9_]{50,}", "critical"),
    ("AWS Access Key", r"AKIA[0-9A-Z]{16}", "critical"),
    ("Supabase service JWT", r"eyJhbGciOi[A-Za-z0-9._-]{100,}\.eyJ[A-Za-z0-9._-]{50,}\.[A-Za-z0-9._-]{30,}", "critical"),
    ("Anthropic key", r"sk-ant-[A-Za-z0-9_-]{30,}", "critical"),
    ("OpenAI key", r"sk-(proj-)?[A-Za-z0-9]{40,}", "critical"),
    ("Google API key", r"AIza[A-Za-z0-9_-]{35}", "high"),
    ("Postgres URL with creds", r"postgres(ql)?://[A-Za-z0-9._-]+:[A-Za-z0-9!@#$%^&*()+=._-]{8,}@[A-Za-z0-9.-]+", "critical"),
    ("MySQL URL with creds", r"mysql://[A-Za-z0-9._-]+:[A-Za-z0-9!@#$%^&*()+=._-]{8,}@[A-Za-z0-9.-]+", "critical"),
    ("Mongo URL with creds", r"mongodb(\+srv)?://[A-Za-z0-9._-]+:[A-Za-z0-9!@#$%^&*()+=._-]{8,}@[A-Za-z0-9.-]+", "critical"),
    ("Hardcoded password in code", r"(?i)(password|passwd|pwd)\s*[:=]\s*['\"][A-Za-z0-9!@#$%^&*()+=._-]{8,}['\"]", "high"),
]

# Falsos positivos a ignorar (substring match en la línea)
WHITELIST_SUBSTRINGS = [
    "placeholder", "PLACEHOLDER", "<TOKEN>", "<API_KEY>", "<PASSWORD>",
    "<PASS>", "<PWD>", "<USER>", "<HOST>", "<REGION>", "<ref>",
    "your_key_here", "your-token", "your_password", "REDACTED",
    "***", "xxxx", "XXXX", "example.com", "example.org",
    "ghp_xxxx", "sk-xxxx", "sk_test_xxxx", "sk_live_xxxx",
    "secure_password", "password123", "password: 'password",
    "0000000000000000",  # placeholder hex
]

# Paths a saltar enteros (relative al repo) — ruido conocido
WHITELIST_PATH_PATTERNS = [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    ".claude/settings.json",
    ".claude/settings.local.json",
    "agency-agents/",  # skills marketplace, no son nuestros
    ".env.example",
    ".env.local.example",
    "node_modules/",
    ".github/workflows/ci.yml",  # placeholder hex
    "infra/scripts/audit-client-isolation.py",  # este propio archivo
]


@dataclass
class Finding:
    severity: str
    type: str
    file: str
    line: int
    pattern: str
    excerpt: str
    notes: str = ""


@dataclass
class Report:
    secrets_in_vault: list[Finding] = field(default_factory=list)
    secrets_in_repo: list[Finding] = field(default_factory=list)
    cross_client_refs: list[Finding] = field(default_factory=list)
    capa_4_leaks: list[Finding] = field(default_factory=list)
    files_scanned: int = 0
    bytes_scanned: int = 0


def is_line_whitelisted(line: str) -> bool:
    return any(w in line for w in WHITELIST_SUBSTRINGS)


def is_path_whitelisted(rel_path: str) -> bool:
    rel_norm = rel_path.replace("\\", "/")
    return any(p in rel_norm for p in WHITELIST_PATH_PATTERNS)


def scan_text_for_secrets(path: Path, text: str) -> Iterator[Finding]:
    rel = str(path.relative_to(REPO_ROOT))
    if is_path_whitelisted(rel):
        return
    for lineno, line in enumerate(text.splitlines(), start=1):
        if is_line_whitelisted(line):
            continue
        if len(line) > 2000:  # skip megalines (minified)
            continue
        for label, pattern, severity in SECRET_PATTERNS:
            for m in re.finditer(pattern, line):
                excerpt = line.strip()[:200]
                yield Finding(
                    severity=severity,
                    type=f"secret:{label}",
                    file=rel,
                    line=lineno,
                    pattern=label,
                    excerpt=excerpt[:120] + ("…" if len(excerpt) > 120 else ""),
                )


def scan_cross_client(path: Path, text: str) -> Iterator[Finding]:
    """Detecta una nota que menciona >=2 clientes (potencial cruce)."""
    rel = str(path.relative_to(REPO_ROOT))
    # Solo aplicar a notas en clients/<X>/ — si menciona OTRO cliente, sospechoso
    if "clients/" not in rel and "06-Clientes" not in rel:
        return
    parts = Path(rel).parts
    own_client = None
    for i, p in enumerate(parts):
        if p == "clients" and i + 1 < len(parts):
            own_client = parts[i + 1].lower()
            break
        if p == "06-Clientes" and i + 1 < len(parts):
            own_client = parts[i + 1].lower()
            break

    if not own_client or own_client.startswith("_"):
        return

    text_lower = text.lower()
    other_clients_found = []
    for slug in KNOWN_CLIENTS:
        if slug == own_client:
            continue
        # Buscar slug como palabra completa
        if re.search(r"\b" + re.escape(slug) + r"\b", text_lower):
            other_clients_found.append(slug)

    if other_clients_found:
        yield Finding(
            severity="medium",
            type="cross-client-ref",
            file=rel,
            line=0,
            pattern=f"own={own_client} mentions={','.join(other_clients_found)}",
            excerpt=f"Nota de '{own_client}' menciona: {', '.join(other_clients_found)}",
            notes="Verificar si la mención es legítima (ej: comparativa) o leakage de contexto",
        )


def scan_capa_4_leaks(path: Path, text: str) -> Iterator[Finding]:
    """Detecta menciones de Capa 4 (La Caleta, Ecomglobalbox personal) en contextos PACAME públicos."""
    rel = str(path.relative_to(REPO_ROOT))
    # Carpetas "públicas" donde Capa 4 NUNCA debería aparecer
    public_paths = [
        "web/app/",  # frontend público
        "agency-agents/",
        "strategy/",
        "workflows/",
        "agents/",
    ]
    if not any(p in rel for p in public_paths):
        return
    # Excepción: estrategia interna (strategy/arquitectura-3-capas.md) sí menciona capas
    if "arquitectura" in rel.lower() or "capas" in rel.lower():
        return

    text_lower = text.lower()
    for entidad in CAPA_4_ENTIDADES:
        for m in re.finditer(r"\b" + re.escape(entidad) + r"\b", text_lower):
            # Buscar línea
            pos = m.start()
            line_start = text.rfind("\n", 0, pos) + 1
            line_end = text.find("\n", pos)
            if line_end == -1:
                line_end = len(text)
            line_content = text[line_start:line_end].strip()
            lineno = text.count("\n", 0, pos) + 1
            yield Finding(
                severity="high",
                type="capa-4-leak",
                file=rel,
                line=lineno,
                pattern=entidad,
                excerpt=line_content[:200],
                notes=f"Entidad Capa 4 '{entidad}' aparece en contexto público — verificar regla feedback_no_mencionar_personal_con_pacame",
            )


def walk_files(root: Path) -> Iterator[Path]:
    """Yield archivos texto, ignorando binarios y dirs ruidosos."""
    SKIP_DIRS = {
        ".git", "node_modules", ".next", ".vercel", "dist", "build",
        ".obsidian", ".smart-env", ".trash", ".makemd", ".space",
        "__pycache__", ".venv", "venv", "logs",
    }
    SKIP_EXT = {
        ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
        ".pdf", ".zip", ".tar", ".gz", ".mp4", ".mp3", ".wav",
        ".woff", ".woff2", ".ttf", ".otf", ".eot",
        ".pyc", ".pyo", ".class", ".o", ".so", ".dll", ".exe",
    }
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fname in filenames:
            ext = Path(fname).suffix.lower()
            if ext in SKIP_EXT:
                continue
            p = Path(dirpath) / fname
            try:
                if p.stat().st_size > 5 * 1024 * 1024:  # skip files > 5MB
                    continue
            except OSError:
                continue
            yield p


def scan_dir(root: Path, report: Report, scope: str) -> None:
    if not root.exists():
        return
    for path in walk_files(root):
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        report.files_scanned += 1
        report.bytes_scanned += len(text)

        for f in scan_text_for_secrets(path, text):
            if scope == "vault":
                report.secrets_in_vault.append(f)
            else:
                report.secrets_in_repo.append(f)

        for f in scan_cross_client(path, text):
            report.cross_client_refs.append(f)

        for f in scan_capa_4_leaks(path, text):
            report.capa_4_leaks.append(f)


def print_human(report: Report) -> int:
    has_critical = False

    print("=" * 78)
    print(f"AUDITORÍA AISLAMIENTO CLIENTES PACAME — {report.files_scanned} archivos / {report.bytes_scanned // 1024} KB")
    print("=" * 78)

    sections = [
        ("🔴 SECRETS EN VAULT (URGENTE — vault va a GitHub privado)", report.secrets_in_vault),
        ("🟡 SECRETS EN REPO PACAME", report.secrets_in_repo),
        ("⚠️  CROSS-REFERENCIAS ENTRE CLIENTES", report.cross_client_refs),
        ("⚠️  CAPA 4 LEAKS (entidades aparte en contexto público)", report.capa_4_leaks),
    ]

    for title, findings in sections:
        if not findings:
            print(f"\n✅ {title}: 0 issues")
            continue
        print(f"\n{title} ({len(findings)} issues):")
        for f in findings[:30]:  # cap a 30 por sección
            tag = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "⚪"}.get(f.severity, "·")
            print(f"  {tag} [{f.severity}] {f.file}:{f.line}")
            print(f"     {f.type}")
            if f.excerpt:
                print(f"     ▸ {f.excerpt}")
            if f.notes:
                print(f"     · {f.notes}")
            if f.severity == "critical":
                has_critical = True
        if len(findings) > 30:
            print(f"  ... y {len(findings) - 30} más")

    print("\n" + "=" * 78)
    print(f"Total issues: {sum(len(s[1]) for s in sections)}")
    print("=" * 78)

    return 1 if has_critical else 0


def print_json(report: Report) -> int:
    out = {
        "files_scanned": report.files_scanned,
        "bytes_scanned": report.bytes_scanned,
        "secrets_in_vault": [asdict(f) for f in report.secrets_in_vault],
        "secrets_in_repo": [asdict(f) for f in report.secrets_in_repo],
        "cross_client_refs": [asdict(f) for f in report.cross_client_refs],
        "capa_4_leaks": [asdict(f) for f in report.capa_4_leaks],
    }
    print(json.dumps(out, indent=2, ensure_ascii=False))
    has_critical = any(f.severity == "critical" for f in report.secrets_in_vault + report.secrets_in_repo)
    return 1 if has_critical else 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--scan-vault", action="store_true", help="Solo escanear vault")
    p.add_argument("--scan-repo", action="store_true", help="Solo escanear repo")
    p.add_argument("--json", action="store_true", help="Output JSON")
    p.add_argument("--strict", action="store_true", help="Exit 1 si críticos")
    args = p.parse_args()

    do_vault = args.scan_vault or not args.scan_repo
    do_repo = args.scan_repo or not args.scan_vault

    report = Report()

    if do_vault:
        scan_dir(VAULT, report, "vault")
    if do_repo:
        # Excluir el vault de la pasada del repo (evita doble cuenta)
        for sub in REPO_ROOT.iterdir():
            if sub.name in {"PacameCueva", ".git", "node_modules", ".next", ".vercel"}:
                continue
            if sub.is_file():
                try:
                    text = sub.read_text(encoding="utf-8", errors="replace")
                    report.files_scanned += 1
                    report.bytes_scanned += len(text)
                    for f in scan_text_for_secrets(sub, text):
                        report.secrets_in_repo.append(f)
                except Exception:
                    pass
            else:
                scan_dir(sub, report, "repo")

    code = print_json(report) if args.json else print_human(report)
    return code if args.strict else 0


if __name__ == "__main__":
    sys.exit(main())
