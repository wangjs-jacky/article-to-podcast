# Article to Podcast

Automatically convert Markdown articles into narrated podcasts (MP3) and slideshow videos (MP4).

[中文文档](./README_CN.md)

## Features

- **LLM-powered script generation** — Claude rewrites articles into podcast-ready scripts
- **Smart slide generation** — Automatically splits scripts into multiple slide types (title, content, cards, highlight, comparison)
- **TTS synthesis** — Supports Doubao (Volcengine) and other TTS engines, with per-segment speaker overrides
- **Remotion video rendering** — 1920×1080 slideshow videos with entrance animations and captions
- **Multi-theme support** — Built-in Terminal Noir (cyberpunk) and Sunset Glow (warm) themes, extensible
- **Resume support** — TTS synthesis caches individual segments; reruns skip completed segments
- **Unified CLI** — One command for the full pipeline, with `--from=N` to start from any step

## Quick Start

### Prerequisites

- Node.js 22+
- ffmpeg (audio concatenation and video composition)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (for LLM steps)

### Configuration

Edit `article.config.json`:

```json
{
  "tts": {
    "provider": "doubao",
    "speaker": "Vivi",
    "speed": 1.0,
    "overrides": {}
  },
  "duration": {
    "targetSeconds": 60,
    "charsPerSecond": 4
  },
  "theme": "terminal-noir",
  "output": "output"
}
```

### Usage

```bash
# Process a full article using Claude Code skill
/article-to-podcast your-article.md

# Run TTS synthesis only (Step 3)
cd pipeline && npm run tts

# Run video rendering only (Step 4)
cd pipeline && npm run render

# Unified CLI, starting from a specific step
cd pipeline && npx tsx src/run.ts --from=3

# Specify output directory name
cd pipeline && npx tsx src/run.ts --from=3 --output-name=my-podcast
```

## Project Structure

```
article-to-podcast/
├── pipeline/            # TTS synthesis, ffmpeg concat, Remotion invocation
├── remotion-player/     # Remotion slide components and video composition
├── skills/              # Claude Code skill (handles LLM steps)
├── output/              # Build artifacts (gitignored)
└── article.config.json  # Global configuration
```

## Pipeline Steps

| Step | Description | Tool |
|------|-------------|------|
| 1 | Article → Podcast script | Claude (LLM) |
| 2 | Script → Slides JSON | Claude (LLM) |
| 3 | Script + Slides → Audio + Timestamps | Doubao TTS + ffmpeg |
| 4 | Slides + Audio → Video | Remotion + ffmpeg |

## Themes

| Theme | Style |
|-------|-------|
| `terminal-noir` | Cyberpunk dark, neon green/sky blue/amber accents |
| `sunset-glow` | Warm dark tones, rose gold/coral/warm gold accents |

Set the `"theme"` field in `article.config.json` to switch themes.

## Speakers

Configure the voice via `tts.speaker`. Supports all Doubao TTS voices:

| Speaker | Style |
|---------|-------|
| Vivi | Female, gentle and natural |
| 知性灿灿 | Female, composed and intellectual |
| 云舟 | Male, warm |
| 儒雅逸辰 | Male, elegant |

Override speakers per segment via `tts.overrides`:

```json
{
  "tts": {
    "speaker": "Vivi",
    "overrides": {
      "summary": { "speaker": "儒雅逸辰", "speed": 0.9 }
    }
  }
}
```

## License

MIT
