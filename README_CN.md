# Article to Podcast

将 Markdown 文章自动转换为口播播客（MP3）和幻灯片讲解视频（MP4）。

[English](./README.md)

## 功能特性

- **LLM 驱动脚本生成** — Claude 将文章改写为适合口播的播客脚本
- **智能幻灯片生成** — 自动将脚本拆分为多种幻灯片类型（标题、内容、卡片、高亮、对比）
- **TTS 语音合成** — 支持豆包（火山引擎）等多种 TTS 引擎，可按段落切换音色
- **Remotion 视频渲染** — 1920×1080 幻灯片视频，带入场动画和字幕
- **多主题支持** — 内置 Terminal Noir（赛博朋克）和 Sunset Glow（暖阳）两种主题，可扩展
- **断点续跑** — TTS 合成支持段落级缓存，中断后重跑自动跳过已合成段落
- **统一 CLI** — 一条命令跑完全流程，支持 `--from=N` 从任意步骤开始

## 快速开始

### 前置条件

- Node.js 22+
- ffmpeg（音频拼接和视频合成）
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)（用于 LLM 步骤）

### 配置

编辑 `article.config.json`：

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

### 运行

```bash
# 在 Claude Code 中调用 skill，处理整篇文章
/article-to-podcast your-article.md

# 单独运行 TTS 合成（Step 3）
cd pipeline && npm run tts

# 单独运行视频渲染（Step 4）
cd pipeline && npm run render

# 统一 CLI，从指定步骤开始
cd pipeline && npx tsx src/run.ts --from=3

# 指定输出目录名
cd pipeline && npx tsx src/run.ts --from=3 --output-name=my-podcast
```

## 项目结构

```
article-to-podcast/
├── pipeline/          # TTS 合成、ffmpeg 拼接、Remotion 调用
├── remotion-player/   # Remotion 幻灯片组件和视频合成
├── skills/            # Claude Code skill（处理 LLM 步骤）
├── output/            # 中间产物（gitignore）
└── article.config.json  # 全局配置
```

## 流水线步骤

| Step | 说明 | 工具 |
|------|------|------|
| 1 | 文章 → 播客脚本 | Claude (LLM) |
| 2 | 脚本 → 幻灯片 JSON | Claude (LLM) |
| 3 | 脚本 + 幻灯片 → 语音 + 时间戳 | 豆包 TTS + ffmpeg |
| 4 | 幻灯片 + 音频 → 视频 | Remotion + ffmpeg |

## 主题

| 主题 | 风格 |
|------|------|
| `terminal-noir` | 赛博朋克暗黑，霓虹绿/天蓝/琥珀色强调 |
| `sunset-glow` | 暖阳暗色调，玫瑰金/珊瑚/暖金色强调 |

在 `article.config.json` 中设置 `"theme"` 字段切换主题。

## 音色

通过 `tts.speaker` 配置音色，支持豆包 TTS 的全部音色：

| 音色名 | 特点 |
|--------|------|
| Vivi | 女声，温柔自然 |
| 知性灿灿 | 女声，知性沉稳 |
| 云舟 | 男声，温和 |
| 儒雅逸辰 | 男声，儒雅 |

可以通过 `tts.overrides` 按段落覆盖音色：

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

## 许可证

MIT
