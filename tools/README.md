# PACAME Tools (WAT Framework)

Python scripts that agents use to take deterministic actions.

## Available Tools

| Tool | Purpose | Used By |
|------|---------|---------|
| `score_lead.py` | Score leads against ICP (0-25) | Sage, Lead Gen Pipeline |
| `scrape_google_maps.py` | Scrape businesses from Google Maps via Apify | Atlas, Lead Gen Pipeline |
| `audit_website.py` | Quick automated website audit | Atlas, Lead Gen Pipeline |
| `generate_outreach.py` | Generate personalized cold email sequences | Copy, Lead Gen Pipeline |

## Required Environment Variables

```env
CLAUDE_API_KEY=sk-ant-...          # For generate_outreach.py
APIFY_API_KEY=apify_api_...        # For scrape_google_maps.py
```

## Usage

All tools accept JSON input via CLI arguments:

```bash
# Score a lead
python tools/score_lead.py '{"name": "Juan", "email": "j@test.com", "budget": "1.500 €"}'

# Audit a website
python tools/audit_website.py --url "https://example.com"

# Scrape Google Maps
python tools/scrape_google_maps.py --query "restaurantes" --location "Madrid" --max 50

# Generate outreach emails
python tools/generate_outreach.py --lead '{"name": "Restaurant X", ...}' --audit '{"issues": [...], ...}'
```
