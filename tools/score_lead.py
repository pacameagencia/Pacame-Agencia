"""
Lead ICP Scoring Tool
Scores a lead against PACAME's Ideal Customer Profile.
Used by: Sage (qualification), Lead Gen Pipeline
"""

import json
import sys
from typing import Optional


def score_lead(
    name: str,
    email: str,
    budget: Optional[str] = None,
    message: Optional[str] = None,
    website: Optional[str] = None,
    services: Optional[list] = None,
    company: Optional[str] = None,
) -> dict:
    """Score a lead 0-25 based on ICP fit."""

    scores = {
        "budget": 3,
        "urgency": 3,
        "authority": 3,
        "maturity": 3,
        "growth": 3,
    }

    # Budget scoring
    if budget:
        budget_lower = budget.lower()
        if "5.000" in budget_lower or "5000" in budget_lower or "más de" in budget_lower:
            scores["budget"] = 5
        elif "3.000" in budget_lower or "3000" in budget_lower:
            scores["budget"] = 5
        elif "1.500" in budget_lower or "1500" in budget_lower:
            scores["budget"] = 4
        elif "500" in budget_lower:
            scores["budget"] = 3
        elif "menos" in budget_lower or "no estoy" in budget_lower:
            scores["budget"] = 2

    # Urgency scoring (from message keywords)
    if message:
        msg_lower = message.lower()
        if any(w in msg_lower for w in ["urgente", "ya", "asap", "esta semana", "inmediato"]):
            scores["urgency"] = 5
        elif any(w in msg_lower for w in ["este mes", "pronto", "lo antes posible"]):
            scores["urgency"] = 4
        elif any(w in msg_lower for w in ["explorando", "información", "curiosidad"]):
            scores["urgency"] = 2

    # Authority scoring
    if company:
        scores["authority"] = 4  # Has a company = likely decision maker
    if message and any(w in message.lower() for w in ["soy el dueño", "mi empresa", "mi negocio"]):
        scores["authority"] = 5

    # Maturity scoring
    if website:
        scores["maturity"] = 4  # Has website = some digital presence
    if services and len(services) >= 3:
        scores["maturity"] = 5  # Knows they need multiple services

    # Growth scoring
    if services and len(services) >= 2:
        scores["growth"] = 4
    if services and len(services) >= 4:
        scores["growth"] = 5

    total = sum(scores.values())

    if total >= 20:
        tier = "HOT"
        action = "Notify Pablo immediately. Draft proposal within 2 hours."
    elif total >= 14:
        tier = "WARM"
        action = "Send value email. Follow up in 3 days."
    elif total >= 8:
        tier = "COLD"
        action = "Auto-reply with resources. Add to newsletter."
    else:
        tier = "NOT_QUALIFIED"
        action = "Polite decline with resource links."

    return {
        "lead_name": name,
        "lead_email": email,
        "total_score": total,
        "max_score": 25,
        "tier": tier,
        "scores": scores,
        "recommended_action": action,
        "services_requested": services or [],
    }


if __name__ == "__main__":
    # CLI usage: python score_lead.py '{"name": "...", "email": "...", ...}'
    if len(sys.argv) > 1:
        data = json.loads(sys.argv[1])
        result = score_lead(**data)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        # Example
        result = score_lead(
            name="Juan García",
            email="juan@restaurante.es",
            budget="1.500 – 3.000 €",
            message="Necesito una web nueva para mi restaurante. La actual es de 2018 y no se ve bien en móvil.",
            website="http://restaurante-juan.es",
            services=["Desarrollo Web", "SEO"],
            company="Restaurante Juan",
        )
        print(json.dumps(result, indent=2, ensure_ascii=False))
