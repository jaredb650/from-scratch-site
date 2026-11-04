#!/usr/bin/env bash
# Rebuild every derived asset in public/ from the flyer + promo projects (read only).
#   npm run assets            everything
#   npm run assets -- fonts   one step: fonts | images | video
# Heavy jobs run under `nice` so they don't fight Ableton.
set -euo pipefail
cd "$(dirname "$0")/.."

FLYER="${FLYER:-/Users/jaredbeguelin/code/liveSeshFLyer/flyer}"
PROMO="${PROMO:-/Users/jaredbeguelin/code/liveSeshFLyer/promo}"
STEP="${1:-all}"

fonts() {
  mkdir -p public/fonts
  # Latin + Latin-1 (Spanish accents, ¿ ¡ ñ), general punctuation, arrows, ×, −
  local U="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+2190-2193,U+00D7,U+2212,U+25B6,U+25A0"
  for f in Orbitron Outfit ChonkyPixels; do
    python3 -m fontTools.subset "$FLYER/assets/$f.ttf" --unicodes="$U" --flavor=woff2 --layout-features='*' \
      --output-file="public/fonts/$f.woff2"
    echo "font $f: $(du -k public/fonts/$f.woff2 | cut -f1)K"
  done
}

images() {
  FLYER="$FLYER" nice python3 scripts/prep_images.py
}

video() {
  mkdir -p public/media
  # Session clips: 2160x1350 screen recordings, ~8 s each, 4 bars. 1280x800 H.264 + AAC for the unmute control.
  for c in acid2 acid melody1 melody2 melody3; do
    nice ffmpeg -v error -y -i "$PROMO/public/media/$c.mp4" \
      -vf "scale=1280:800:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 26 -profile:v high \
      -movflags +faststart -c:a aac -b:a 112k -ac 2 "public/media/$c.mp4"
    nice ffmpeg -v error -y -ss 2.2 -i "$PROMO/public/media/$c.mp4" -frames:v 1 -vf "scale=1280:800:flags=lanczos" /tmp/fs-poster.png
    nice avifenc -q 60 -s 5 /tmp/fs-poster.png "public/media/$c.avif" >/dev/null
    cwebp -quiet -q 74 /tmp/fs-poster.png -o "public/media/$c.webp"
    echo "clip $c: $(du -k public/media/$c.mp4 | cut -f1)K"
  done
  # The 4:5 reel (59 s, with the song). 720x900 keeps it light; it only loads near the viewport.
  nice ffmpeg -v error -y -i "$PROMO/out/meka-from-scratch-promo-4x5.mp4" \
    -vf "scale=720:900:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 27 -profile:v high \
    -movflags +faststart -c:a aac -b:a 128k "public/media/reel.mp4"
  nice ffmpeg -v error -y -ss 1.5 -i "$PROMO/out/meka-from-scratch-promo-4x5.mp4" -frames:v 1 -vf "scale=720:900:flags=lanczos" /tmp/fs-poster.png
  nice avifenc -q 62 -s 5 /tmp/fs-poster.png public/media/reel.avif >/dev/null
  cwebp -quiet -q 76 /tmp/fs-poster.png -o public/media/reel.webp
  echo "reel: $(du -k public/media/reel.mp4 | cut -f1)K"
}

case "$STEP" in
  fonts) fonts ;;
  images) images ;;
  video) video ;;
  all) fonts; images; video ;;
  *) echo "unknown step $STEP"; exit 1 ;;
esac
