#!/usr/bin/env bash
# Phase E render concept 007 dark-frames-pablo-gta-vi-day
# Pipeline: 4 shots Seedance 720p -> upscale 1080p -> Vice-City LUT -> 4 captions -> + outro Dark Room
# Output: reel_v1_30fps_master.mp4 (~16-18s · 1080x1920 H.264 12 Mbps)

set -euo pipefail
cd "$(dirname "$0")/output/dark-frames-007-pablo-gta-vi-day"

SHOTS_DIR="shots"
FINAL_DIR="final"
mkdir -p "$FINAL_DIR"

# Asset paths
OUTRO="../../assets/outro-darkroom-2s-v2.mp4"
FONT="../../../carruseles-darkroom/fonts/Anton-Regular.ttf"
FONT_FFMPEG="$(echo "$FONT" | sed 's|/|\\\\|g' | sed 's|^\\\\|C\\\\:\\\\|')"  # Windows ffmpeg path escaping

# Verify all 4 shots exist
for SHOT in S1 S2 S3 S4; do
  if [ ! -f "$SHOTS_DIR/${SHOT}_*.mp4" ] && [ ! -f "$SHOTS_DIR/${SHOT}_seedance_test.mp4" ] && [ ! -f "$SHOTS_DIR/${SHOT}_*_seedance.mp4" ]; then
    # Look for any matching MP4
    if ! ls $SHOTS_DIR/${SHOT}*.mp4 2>/dev/null | head -1 > /dev/null; then
      echo "❌ Missing shot $SHOT in $SHOTS_DIR/"
      exit 1
    fi
  fi
done

# Resolve shot files
S1=$(ls "$SHOTS_DIR"/S1_*.mp4 | head -1)
S2=$(ls "$SHOTS_DIR"/S2_*.mp4 | head -1)
S3=$(ls "$SHOTS_DIR"/S3_*.mp4 | head -1)
S4=$(ls "$SHOTS_DIR"/S4_*.mp4 | head -1)

echo "Shots resolved:"
echo "  S1: $S1"
echo "  S2: $S2"
echo "  S3: $S3"
echo "  S4: $S4"
echo "  Outro: $OUTRO"

# Step 1: Upscale + normalize each shot to 1080x1920 30fps
echo "→ Step 1: upscale 4 shots to 1080x1920 30fps"
for IDX in 1 2 3 4; do
  VAR="S${IDX}"
  SRC="${!VAR}"
  OUT="$SHOTS_DIR/normalized_S${IDX}.mp4"
  ffmpeg -y -i "$SRC" \
    -vf "scale=1080:1920:flags=lanczos,fps=30,setsar=1" \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ar 48000 \
    "$OUT" 2>/dev/null
done

# Step 2: Apply Vice-City LUT cyan-magenta split via curves filter
echo "→ Step 2: apply Vice-City LUT cyan-magenta split"
for IDX in 1 2 3 4; do
  IN="$SHOTS_DIR/normalized_S${IDX}.mp4"
  OUT="$SHOTS_DIR/lut_S${IDX}.mp4"
  ffmpeg -y -i "$IN" \
    -vf "curves=red='0/0 0.3/0.25 0.7/0.78 1/1':blue='0/0.05 0.3/0.35 0.7/0.72 1/0.95':green='0/0 0.5/0.5 1/1',eq=saturation=1.12:contrast=1.05" \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
    -c:a copy "$OUT" 2>/dev/null
done

# Step 3: Burn captions per shot
# S2 @1.5s "UN DÍA EN VICE BEACH" off-white #F4F1EA upper-third
# S3 @2.0s "NO ES GTA VI" acid green #CFFF00 lower-third
# S4 @0.5s "VICE BEACH · 7 PM" off-white small lower-left
# S4 @2.0s "PABLO PACAME · DARK ROOM" acid green lower-third
echo "→ Step 3: burn 4 captions Anton ALL CAPS"

# S1 captions: NONE
cp "$SHOTS_DIR/lut_S1.mp4" "$SHOTS_DIR/captioned_S1.mp4"

# S2 caption "UN DÍA EN VICE BEACH" @1.5s for 2.2s
ffmpeg -y -i "$SHOTS_DIR/lut_S2.mp4" \
  -vf "drawtext=fontfile='$FONT':text='UN DÍA EN VICE BEACH':fontcolor=#F4F1EA:fontsize=72:x=(w-text_w)/2:y=h/4:enable='between(t,1.5,3.5)'" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy \
  "$SHOTS_DIR/captioned_S2.mp4" 2>/dev/null

# S3 caption "NO ES GTA VI" @2.0s for 1.8s
ffmpeg -y -i "$SHOTS_DIR/lut_S3.mp4" \
  -vf "drawtext=fontfile='$FONT':text='NO ES GTA VI':fontcolor=#CFFF00:fontsize=92:x=(w-text_w)/2:y=h-h/3:enable='between(t,2.0,3.8)'" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy \
  "$SHOTS_DIR/captioned_S3.mp4" 2>/dev/null

# S4 captions stacked: "VICE BEACH · 7 PM" + "PABLO PACAME · DARK ROOM"
ffmpeg -y -i "$SHOTS_DIR/lut_S4.mp4" \
  -vf "drawtext=fontfile='$FONT':text='VICE BEACH · 7 PM':fontcolor=#F4F1EA:fontsize=42:x=80:y=h-200:enable='between(t,0.5,2.3)',drawtext=fontfile='$FONT':text='PABLO PACAME · DARK ROOM':fontcolor=#CFFF00:fontsize=68:x=(w-text_w)/2:y=h-h/3:enable='between(t,2.0,3.0)'" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy \
  "$SHOTS_DIR/captioned_S4.mp4" 2>/dev/null

# Step 4: Add silent audio track to outro (outro has no audio)
echo "→ Step 4: add silent audio to outro + normalize 30fps"
ffmpeg -y -i "$OUTRO" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  -vf "scale=1080:1920:flags=lanczos,fps=30,setsar=1" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 \
  -shortest "$SHOTS_DIR/normalized_outro.mp4" 2>/dev/null

# Step 5: Concat 4 captioned shots + outro
echo "→ Step 5: concat 4 shots + outro"
cat > "$SHOTS_DIR/concat_list.txt" <<EOF
file 'captioned_S1.mp4'
file 'captioned_S2.mp4'
file 'captioned_S3.mp4'
file 'captioned_S4.mp4'
file 'normalized_outro.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$SHOTS_DIR/concat_list.txt" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.0 \
  -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart \
  "$FINAL_DIR/reel_v1_30fps_master.mp4" 2>&1 | tail -5

echo ""
echo "✅ Phase E complete · master: $FINAL_DIR/reel_v1_30fps_master.mp4"
ffprobe -v error -show_entries stream=width,height,duration,codec_name,r_frame_rate -show_entries format=duration,size -of json "$FINAL_DIR/reel_v1_30fps_master.mp4" 2>&1 | python -c "
import json, sys
d = json.load(sys.stdin)
print(f\"  Duration: {d['format']['duration']}s\")
print(f\"  Size: {int(d['format']['size'])/1024/1024:.2f} MB\")
for s in d['streams']:
    print(f\"  Stream: {s.get('codec_name','?')} {s.get('width','?')}x{s.get('height','?')} @ {s.get('r_frame_rate','?')}\")
"
