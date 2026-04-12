"""
Outreach Email Generator Tool
Generates hyper-personalized cold emails based on lead data + website audit.
Used by: Lead Gen Pipeline (Step 5)

Usage: python generate_outreach.py --lead '{"name": "...", ...}' --audit '{"issues": [...], ...}'
"""

import argparse
import json
import os
import sys
from urllib.request import Request, urlopen


CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")


def generate_outreach(lead: dict, audit: dict) -> dict:
    """Generate a 3-email sequence personalized to the lead's specific situation."""

    if not CLAUDE_API_KEY:
        print("ERROR: Set CLAUDE_API_KEY environment variable")
        sys.exit(1)

    issues_text = "\n".join(f"- {issue}" for issue in audit.get("issues", []))
    score = audit.get("score", 50)

    prompt = f"""Eres Copy, copywriter de PACAME, una agencia digital con agentes IA en Madrid.

Genera una secuencia de 3 emails de outreach frio para este lead:

LEAD:
- Nombre del negocio: {lead.get('name', 'N/A')}
- Sector: {lead.get('category', 'N/A')}
- Ubicacion: {lead.get('location', 'N/A')}
- Website: {lead.get('website', 'No tiene')}
- Rating Google: {lead.get('rating', 'N/A')} ({lead.get('reviews', 0)} reseñas)

AUDITORIA DE SU WEB (puntuacion: {score}/100):
{issues_text if issues_text else "- Web no accesible o no existe"}

REGLAS:
- Tono cercano, tutea, sin ser agresivo
- Cada email < 150 palabras
- El hook menciona algo ESPECIFICO de su negocio (no generico)
- No mencionar "IA" ni "agentes" - hablar de resultados
- CTA: diagnostico gratuito de su web (link a pacameagencia.com/contacto)
- Firma: Pablo Calleja, PACAME | pacameagencia.com

FORMATO (JSON):
{{
  "email_1_day0": {{"subject": "...", "body": "..."}},
  "email_2_day3": {{"subject": "...", "body": "..."}},
  "email_3_day7": {{"subject": "...", "body": "..."}}
}}"""

    payload = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 1500,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")

    req = Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
        },
    )

    try:
        with urlopen(req) as response:
            data = json.loads(response.read())
            text = data["content"][0]["text"]

            # Try to parse the JSON from the response
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                emails = json.loads(text[start:end])
            else:
                emails = {"raw": text}

            return {
                "lead": lead.get("name"),
                "emails": emails,
                "model_used": data.get("model"),
                "tokens_used": data.get("usage", {}).get("output_tokens", 0),
            }
    except Exception as e:
        error_detail = str(e)
        if hasattr(e, 'read'):
            error_detail += " — " + e.read().decode("utf-8", errors="ignore")
        return {"error": error_detail, "lead": lead.get("name")}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate outreach emails")
    parser.add_argument("--lead", required=True, help="Lead data as JSON string")
    parser.add_argument("--audit", required=True, help="Website audit as JSON string")
    args = parser.parse_args()

    lead = json.loads(args.lead)
    audit = json.loads(args.audit)

    result = generate_outreach(lead, audit)
    print(json.dumps(result, indent=2, ensure_ascii=False))
