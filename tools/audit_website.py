"""
Website Audit Tool
Quick automated audit of a prospect's website for lead qualification.
Used by: Lead Gen Pipeline (Step 2), Client Onboarding (Step 3)

Usage: python audit_website.py --url "https://example.com"
"""

import argparse
import json
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import ssl
import time


def audit_website(url: str) -> dict:
    """Perform a quick automated audit of a website."""

    results = {
        "url": url,
        "accessible": False,
        "ssl": False,
        "load_time_ms": None,
        "has_title": False,
        "has_meta_description": False,
        "has_viewport": False,
        "issues": [],
        "score": 0,
        "opportunity_score": 0,
    }

    # Ensure URL has protocol
    if not url.startswith("http"):
        url = f"https://{url}"

    # Test HTTPS
    try:
        ctx = ssl.create_default_context()
        start = time.time()
        req = Request(url, headers={"User-Agent": "PACAME-Audit/1.0"})
        with urlopen(req, context=ctx, timeout=10) as response:
            html = response.read().decode("utf-8", errors="ignore")
            elapsed = (time.time() - start) * 1000

        results["accessible"] = True
        results["ssl"] = url.startswith("https")
        results["load_time_ms"] = round(elapsed)

        # Check basic SEO elements
        html_lower = html.lower()

        if "<title>" in html_lower and "</title>" in html_lower:
            results["has_title"] = True
        else:
            results["issues"].append("Missing <title> tag")

        if 'name="description"' in html_lower or "name='description'" in html_lower:
            results["has_meta_description"] = True
        else:
            results["issues"].append("Missing meta description")

        if 'name="viewport"' in html_lower:
            results["has_viewport"] = True
        else:
            results["issues"].append("Missing viewport meta (not mobile-friendly)")

        if not results["ssl"]:
            results["issues"].append("No SSL certificate (HTTP only)")

        if results["load_time_ms"] and results["load_time_ms"] > 3000:
            results["issues"].append(f"Slow load time: {results['load_time_ms']}ms (target: <3000ms)")

        if "<h1" not in html_lower:
            results["issues"].append("Missing H1 tag")

        if "schema.org" not in html_lower and "application/ld+json" not in html_lower:
            results["issues"].append("No schema markup detected")

        # Calculate scores
        checks = [
            results["ssl"],
            results["has_title"],
            results["has_meta_description"],
            results["has_viewport"],
            results["load_time_ms"] is not None and results["load_time_ms"] < 3000,
            "<h1" in html_lower,
            "schema.org" in html_lower or "application/ld+json" in html_lower,
        ]
        results["score"] = round(sum(checks) / len(checks) * 100)

        # Opportunity score: worse website = higher opportunity for PACAME
        results["opportunity_score"] = 100 - results["score"]

    except ssl.SSLError:
        results["issues"].append("SSL certificate error")
        results["opportunity_score"] = 90
    except URLError as e:
        results["issues"].append(f"Cannot reach website: {str(e.reason)}")
        results["opportunity_score"] = 95
    except Exception as e:
        results["issues"].append(f"Error: {str(e)}")
        results["opportunity_score"] = 80

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Quick website audit")
    parser.add_argument("--url", required=True, help="Website URL to audit")
    args = parser.parse_args()

    result = audit_website(args.url)
    print(json.dumps(result, indent=2, ensure_ascii=False))
