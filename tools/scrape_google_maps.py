"""
Google Maps Scraper Tool
Scrapes businesses from Google Maps by location and niche.
Used by: Lead Gen Pipeline (Step 1)
Requires: Apify API key in APIFY_API_KEY env var

Usage: python scrape_google_maps.py --query "restaurantes" --location "Madrid" --max 100
"""

import argparse
import json
import os
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError


APIFY_API_KEY = os.environ.get("APIFY_API_KEY")
APIFY_ACTOR = "nwua9Gu5YrADL7ZDj"  # Google Maps Scraper actor


def scrape_maps(query: str, location: str, max_results: int = 100) -> list:
    """Scrape Google Maps for businesses matching query + location."""

    if not APIFY_API_KEY:
        print("ERROR: Set APIFY_API_KEY environment variable")
        sys.exit(1)

    # Scrape by zip code areas for maximum coverage
    search_query = f"{query} en {location}"

    payload = json.dumps({
        "searchStringsArray": [search_query],
        "maxCrawledPlacesPerSearch": max_results,
        "language": "es",
        "includeWebResults": False,
    }).encode("utf-8")

    url = f"https://api.apify.com/v2/acts/{APIFY_ACTOR}/runs?token={APIFY_API_KEY}"
    req = Request(url, data=payload, headers={"Content-Type": "application/json"})

    try:
        with urlopen(req) as response:
            run_data = json.loads(response.read())
            run_id = run_data["data"]["id"]
            print(f"Apify run started: {run_id}")
            print(f"Check results at: https://console.apify.com/actors/runs/{run_id}")
            return {"run_id": run_id, "status": "running"}
    except HTTPError as e:
        print(f"Apify API error: {e.code} — {e.read().decode()}")
        return {"error": str(e)}


def get_results(run_id: str) -> list:
    """Fetch results from a completed Apify run."""

    url = f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items?token={APIFY_API_KEY}"
    req = Request(url)

    with urlopen(req) as response:
        items = json.loads(response.read())

    leads = []
    for item in items:
        leads.append({
            "name": item.get("title", ""),
            "address": item.get("address", ""),
            "phone": item.get("phone", ""),
            "website": item.get("website", ""),
            "rating": item.get("totalScore", 0),
            "reviews": item.get("reviewsCount", 0),
            "category": item.get("categoryName", ""),
            "location": item.get("city", ""),
            "maps_url": item.get("url", ""),
        })

    return leads


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape Google Maps businesses")
    parser.add_argument("--query", required=True, help="Business type (e.g. 'restaurantes')")
    parser.add_argument("--location", required=True, help="City or zip code")
    parser.add_argument("--max", type=int, default=100, help="Max results")
    parser.add_argument("--results", help="Fetch results from run ID")

    args = parser.parse_args()

    if args.results:
        results = get_results(args.results)
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        result = scrape_maps(args.query, args.location, args.max)
        print(json.dumps(result, indent=2, ensure_ascii=False))
