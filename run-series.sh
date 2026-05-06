#!/usr/bin/env bash
set -euo pipefail

# 加载 API key
set -a
source pipeline/.env
set +a

ROOT=$(cd "$(dirname "$0")" && pwd)
CONFIG="$ROOT/article.config.json"

declare -a NAMES=(r01 r02 r03 r04 r05 r06)
declare -a SPEAKERS=("云舟" "爽快思思" "解说小明" "流畅女声" "儒雅逸辰" "知性灿灿")
declare -a CPS=(4.0 4.2 4.2 3.5 3.9 3.6)
declare -a THEMES=("terminal-noir" "sunset-glow" "terminal-noir" "sunset-glow" "terminal-noir" "sunset-glow")

STAGE=${1:-tts}   # tts | render | both

for i in 0 1 2 3 4 5; do
  NAME=${NAMES[$i]}
  SPEAKER=${SPEAKERS[$i]}
  CHARSPERSEC=${CPS[$i]}
  THEME=${THEMES[$i]}

  echo ""
  echo "═══════════════════════════════════════════"
  echo "  ▶ $NAME · 音色=$SPEAKER · 主题=$THEME"
  echo "═══════════════════════════════════════════"

  # 写入临时 config
  cat > "$CONFIG" <<EOF
{
  "tts": {
    "provider": "doubao",
    "speaker": "$SPEAKER",
    "speed": 1.0,
    "overrides": {}
  },
  "duration": {
    "targetSeconds": 120,
    "charsPerSecond": $CHARSPERSEC
  },
  "theme": "$THEME",
  "output": "output"
}
EOF

  cd "$ROOT/pipeline"

  if [[ "$STAGE" == "tts" || "$STAGE" == "both" ]]; then
    npx tsx src/run.ts --from=3 --output-name="$NAME"
  fi

  if [[ "$STAGE" == "render" || "$STAGE" == "both" ]]; then
    npx tsx src/run.ts --from=4 --output-name="$NAME"
  fi

  cd "$ROOT"
done

echo ""
echo "✅ 全部完成"
ls -lh output/r0?/video.mp4 2>/dev/null || true
