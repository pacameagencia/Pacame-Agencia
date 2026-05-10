#!/usr/bin/env bash
set -uo pipefail

BASE_DNA='A small bipedal robot creature mascot, approximately 35cm tall, head-to-body proportions 1:1.5, head is a spherical chassis of COMPLETELY MATTE BLACK metal (NOT brushed silver, NOT chrome, NOT grey - pure deep ink black #0A0A0A only), two large round CUTE eyes glowing acid neon green #CFFF00 with pure dark pupils inside (Stitch-Baymax cute proportions, NOT slit visor NOT humanoid face), a third small circular glowing acid neon green eye EXACTLY in the center of the forehead between the two main eyes, always visible at peak intensity (this is a critical identity anchor - DO NOT skip), a thin vertical black antenna stalk emerging from the top center of the head with THREE small spherical acid green glow nodes spaced evenly along it like a TV aerial (NOT a propeller, NOT a helix cross shape, NOT a Y-shape - a single vertical line with 3 dots), compact body chassis of matte black metal with visible panel joinery, rubber-tech matte black joints with subtle sub-surface scattering, short articulated arms, compact legs with stabilizer pads, off-white #F2F2F2 fine stitching lines visible at joint articulations (Stitch-style detail), micro acid green LEDs only on heel pads, back panel with visible solar mini-cells and status LEDs, no humanoid face, no mouth, expression conveyed entirely through the three glowing eyes.'

VARIATION_A_PROMPT="Ultra-detailed three-quarter standing body shot of ${BASE_DNA} Full standing pose perfectly symmetric, weight evenly distributed, both arms relaxed at sides, head turned slightly toward camera at 15 degrees, all three acid green eyes locked on camera with the central forehead eye clearly visible as a small bright dot between the two large cute eyes. Background: pure matte charcoal black #0A0A0A studio backdrop, single neon acid green key light from upper-camera-left casting dramatic chiaroscuro shadow on right side of mascot (3:1 contrast ratio), subtle atmospheric haze, no gradients elsewhere. Camera: shot on Hasselblad X1D 70mm film lens emulation, f/2.8, ISO 100, vertical portrait orientation. Texture stack: ray-traced global illumination, subsurface scattering on rubber-tech joints, matte black chassis with subtle micro-imperfections (faint scratches only, NO brushed metal finish, NO silver reflections), stitching lines at joints, contact shadows under feet, Kodak Portra 400 push +1 grain emulation, NO plastic CGI cleanliness, NO HDR over-processing. Mood: mysterious tech-noir creature with cute eye empathy, BB-8 + Wall-E + Stitch hybrid in Blade Runner aesthetic. The three-segment fractal vertical antenna with 3 acid green spherical nodes MUST be clearly visible. NO humanoid face, NO mouth, NO extra fingers, NO competitor brand logos, NO readable text on chassis."

VARIATION_B_PROMPT="Ultra-detailed extreme close-up portrait of ${BASE_DNA} Sharper more mysterious mood, head and upper torso only, three-quarter angle facing camera, all three acid green eyes glowing intensely with peak luminance, fractal antenna with 3 acid green nodes prominent against background, head perfectly still no tilt, expression: slightly mischievous curious detective vibe. Background: pure matte charcoal black #0A0A0A with subtle volumetric haze caught in acid green rim light from camera-right, mysterious noir mood, no gradients. Camera: shot on Hasselblad X1D 120mm macro lens, f/4.5, ISO 100, absolute sharpness on the three eyes, infinite depth of field. Texture stack: ray-traced global illumination, matte black chassis micro-imperfections (subtle scratches and oxidation on edges - NO brushed silver), faint fingerprints on glossy surfaces breaking specular highlights, acid green glow with realistic bloom, halation only on brightest LED tips, contact shadows, Kodak Portra 400 push +1 grain. Mood: like detective noir but creature IA, more sharp/edgy than v1 close-up, less cute more mysterious sharp tech-noir. NO humanoid face, NO mouth, NO smiling, NO HDR over-processing."

gen() {
  local kind=$1
  local prompt=$2
  echo "[$kind] starting gpt_image_2..."
  higgsfield generate create gpt_image_2 \
    --prompt "$prompt" \
    --aspect_ratio "3:4" \
    --quality high \
    --resolution 2k \
    --wait --wait-timeout 8m --json \
    > "$kind.json" 2>"$kind.err"
  local rc=$?
  echo "[$kind] done rc=$rc"
}

gen variation-a "$VARIATION_A_PROMPT" &
gen variation-b "$VARIATION_B_PROMPT" &

wait
echo "=== ALL DONE ==="
ls -la variation-*.json variation-*.err 2>/dev/null
