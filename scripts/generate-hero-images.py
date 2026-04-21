#!/usr/bin/env python3
"""
Generate PACAME editorial hero images via OpenAI DALL-E 3.

Creates 12 images total:
 - 1 master hero (home page abstract brand visual)
 - 8 vertical heroes (one per sub-brand: Restaurante, Hotel, Clinica, Gym, Inmo, Shop, Academy, Core)
 - 3 case study mockups (before/after / dashboard / device)

Run:
  export OPENAI_API_KEY=sk-...
  python3 scripts/generate-hero-images.py

All images saved to web/public/hero/ or web/public/verticals/ or web/public/showcase/.
Existing files skipped (idempotent).
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
import concurrent.futures
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_HERO = ROOT / "web" / "public" / "hero"
OUT_VERTICALS = ROOT / "web" / "public" / "verticals"
OUT_SHOWCASE = ROOT / "web" / "public" / "showcase"

for d in (OUT_HERO, OUT_VERTICALS, OUT_SHOWCASE):
    d.mkdir(parents=True, exist_ok=True)

API_KEY = os.environ.get("OPENAI_API_KEY")
if not API_KEY:
    print("ERROR: OPENAI_API_KEY not set")
    sys.exit(1)

# ═══════════════════════════════════════════════════════════════
# PROMPT LIBRARY — editorial tier-1, paleta @design.deb aware
# ═══════════════════════════════════════════════════════════════

EDITORIAL_STYLE = (
    "editorial magazine photography, cinematic composition, "
    "warm ambient lighting, premium high-end aesthetic similar to Monocle Magazine, "
    "Apple product photography, Wallpaper magazine. "
    "Color palette: Ocean Blue (#2872A1), Golden Sand (#F1E194), "
    "Deep Burgundy (#5B0E14), Mint (#00A19B), Ultra Violet (#5F4A8B), "
    "warm ivory and deep navy neutrals. "
    "Strong directional light, shallow depth of field, 50mm lens aesthetic, "
    "professional color grading, no people's faces, no text overlays. "
    "16:9 aspect, high detail."
)

IMAGES = [
    # ─── MASTER HERO ───
    {
        "slug": "master",
        "folder": OUT_HERO,
        "prompt": (
            "Cinematic wide shot: minimalist ocean blue geometric architecture interior, "
            "warm golden sand light filtering through vertical slats creating shadow lines on "
            "polished floor, single elegant bronze sphere floating in frame right, "
            "deep navy walls, marble floor with warm reflections, one thin golden rule "
            "line suggesting horizon. Editorial magazine cover feel. " + EDITORIAL_STYLE
        ),
    },
    # ─── 8 VERTICALS ───
    {
        "slug": "restaurante",
        "folder": OUT_VERTICALS,
        "prompt": (
            "Cinematic top-down flat-lay of modern Spanish restaurant scene: "
            "dark walnut table with single sprig of rosemary, sleek black tablet showing "
            "elegant menu mockup, small espresso cup with golden crema, linen napkin, "
            "warm candle glow top-right, deep burgundy accent on wine glass stem. "
            "Evokes high-end hospitality tech. " + EDITORIAL_STYLE
        ),
    },
    {
        "slug": "hotel",
        "folder": OUT_VERTICALS,
        "prompt": (
            "Cinematic luxury hotel lobby detail: curved ocean-blue velvet armchair in "
            "foreground, warm brass floor lamp, linen booking tablet on side table, "
            "plant shadow play on ivory wall, soft morning light from tall windows, "
            "golden sand rug. Minimalist, Aman Resort aesthetic. " + EDITORIAL_STYLE
        ),
    },
    {
        "slug": "clinica",
        "folder": OUT_VERTICALS,
        "prompt": (
            "Cinematic modern medical clinic reception detail: sleek walnut desk with mint-green "
            "tablet showing appointment calendar mockup, white orchid in simple vase, soft indirect "
            "light from diffused ceiling panels, ocean-blue abstract art on wall, ivory walls, "
            "polished terrazzo floor. Evokes premium private healthcare, not sterile hospital. "
            + EDITORIAL_STYLE
        ),
    },
    {
        "slug": "gym",
        "folder": OUT_VERTICALS,
        "prompt": (
            "Cinematic boutique gym detail: dark ocean-blue textured wall, single kettlebell on "
            "golden sand rubber floor, digital tablet on a wood bench showing mint-green workout "
            "interface mockup, warm brass accent lighting, eucalyptus branch in stone vase. "
            "Equinox-luxury aesthetic, not commercial gym. " + EDITORIAL_STYLE
        ),
    },
    {
        "slug": "inmobiliaria",
        "folder": OUT_VERTICALS,
        "prompt": (
            "Cinematic real estate listing mockup scene: architectural model of modern villa on "
            "walnut desk, blueprints rolled with brass tube, burgundy leather-bound portfolio, "
            "tablet showing property listing interface mockup, single brass key on marble tray, "
            "warm afternoon light. Editorial real estate aesthetic. " + EDITORIAL_STYLE
        ),
    },
    {
        "slug": "ecommerce",
        "folder": OUT_VERTICALS,
        "prompt": (
            "Cinematic ecommerce product photography flat-lay: dark ivory background with single "
            "premium sneaker in ocean blue, golden sand packaging box open showing silk paper, "
            "smartphone in frame showing product page mockup, burgundy tape detail, warm top-down "
            "light with soft shadows. Shopify premium brand aesthetic. " + EDITORIAL_STYLE
        ),
    },
    {
        "slug": "formacion",
        "folder": OUT_VERTICALS,
        "prompt": (
            "Cinematic premium online academy scene: dark walnut desk with open hardcover notebook, "
            "brass pen, ceramic coffee cup, laptop showing elegant course interface mockup with "
            "mint-green progress bar, violet-colored bookmark, single orchid in brass vase, warm "
            "library-style ambient light. MasterClass aesthetic. " + EDITORIAL_STYLE
        ),
    },
    {
        "slug": "saas",
        "folder": OUT_VERTICALS,
        "prompt": (
            "Cinematic tech workspace: dark polished surface with ultra-thin laptop showing abstract "
            "data dashboard interface mockup (ocean blue + mint accents), mechanical keyboard, "
            "architectural model of a data flow in brass wire sculpture, single plant. "
            "Refined enterprise SaaS aesthetic, Stripe/Linear/Arc vibes, not flashy cyberpunk. "
            + EDITORIAL_STYLE
        ),
    },
    # ─── 3 SHOWCASE MOCKUPS ───
    {
        "slug": "dashboard",
        "folder": OUT_SHOWCASE,
        "prompt": (
            "Cinematic close-up of premium laptop screen showing an elegant SaaS analytics dashboard "
            "interface with ocean-blue primary accents, golden sand highlights, mint growth lines "
            "on charts. Editorial mockup style, soft warm reflections, single orchid petal "
            "foreground. Linear-meets-Stripe aesthetic. " + EDITORIAL_STYLE
        ),
    },
    {
        "slug": "mobile-app",
        "folder": OUT_SHOWCASE,
        "prompt": (
            "Cinematic overhead shot of premium smartphone resting on walnut table, screen showing "
            "mobile app mockup with PACAME editorial style (ocean blue + golden sand + mint "
            "accents, large italic serif headline), brass pen and journal beside phone, warm "
            "afternoon light. Apple product photography aesthetic. " + EDITORIAL_STYLE
        ),
    },
    {
        "slug": "branding",
        "folder": OUT_SHOWCASE,
        "prompt": (
            "Cinematic branding mockup scene: dark walnut surface with business cards in ivory paper "
            "with golden foil stamp, ocean-blue envelopes, brass paper clip, brand guideline "
            "booklet slightly open showing elegant typography spread, single orchid stem. "
            "High-end brand identity portfolio shoot. " + EDITORIAL_STYLE
        ),
    },
]


def generate_one(img: dict) -> tuple[str, bool, str]:
    """Generate a single image via DALL-E 3. Returns (slug, ok, msg)."""
    slug = img["slug"]
    folder: Path = img["folder"]
    out_path = folder / f"{slug}.png"

    if out_path.exists():
        return (slug, True, f"skip existing {out_path.name}")

    req_body = json.dumps({
        "model": "dall-e-3",
        "prompt": img["prompt"][:4000],  # DALL-E max 4000 chars
        "n": 1,
        "size": "1792x1024",  # 16:9 landscape
        "quality": "hd",
        "style": "natural",
        "response_format": "url",
    }).encode()

    try:
        req = urllib.request.Request(
            "https://api.openai.com/v1/images/generations",
            data=req_body,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
            img_url = data["data"][0]["url"]

        # Download
        img_req = urllib.request.Request(img_url, headers={"User-Agent": "pacame-gen"})
        with urllib.request.urlopen(img_req, timeout=60) as r:
            out_path.write_bytes(r.read())

        return (slug, True, f"OK {out_path.name} ({out_path.stat().st_size // 1024}KB)")

    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode()
        except Exception:
            body = str(e)
        return (slug, False, f"HTTP {e.code}: {body[:300]}")
    except Exception as e:
        return (slug, False, f"ERR: {e}")


def main():
    print(f"Generating {len(IMAGES)} images in parallel (max 4 concurrent)...\n")
    t0 = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(generate_one, img): img["slug"] for img in IMAGES}
        for fut in concurrent.futures.as_completed(futures):
            slug, ok, msg = fut.result()
            icon = "OK " if ok else "FAIL"
            print(f"  [{icon}] {slug:20s} {msg}")

    print(f"\nTotal: {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
