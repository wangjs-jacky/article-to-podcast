# article-to-podcast 设计文档

> 输入一篇 Markdown 文章，自动产出播客（MP3）和讲解视频（MP4），每个流水线步骤输出可编辑的中间产物。

## 目标

- 输入：Markdown 格式文章
- 输出：`audio.mp3`（播客）+ `video.mp4`（幻灯片讲解视频）
- 自动化：默认全流程一键跑通，支持修改中间产物后从指定步骤重跑

## 参考风格

参考视频：[探索未至之境 - Karpathy AI 编程准则解读](https://www.bilibili.com/video/BV19gQhBqENu)

视觉风格特征：
- 纯白背景，无衬线字体
- PPT 幻灯片式布局，按章节切换
- 彩色卡片 + 图标区分信息（蓝/红/绿/橙对应不同语义）
- 左右对比结构（正确 vs 错误）
- 旁白配音 + 静态帧简单动画

## 架构方案（分层设计）

### 目录结构

```
article-to-podcast/
├── pipeline/                      # TypeScript CLI，负责 AI 步骤
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # CLI 入口（orchestrator）
│       ├── step1-script.ts        # 文章 → 口语化脚本
│       ├── step2-slides.ts        # 脚本 → 幻灯片 JSON
│       ├── step3-tts.ts           # 脚本 → 音频 MP3（播客）
│       └── tts/
│           ├── interface.ts       # TTSProvider 接口（可插拔）
│           └── edge-tts.ts        # 默认占位实现（待替换）
├── remotion-player/               # 独立 Remotion 项目，负责视频渲染
│   ├── package.json
│   ├── remotion.config.ts
│   └── src/
│       ├── Root.tsx
│       ├── types.ts               # slides.json 类型定义
│       └── compositions/
│           └── ArticleVideo/
│               ├── index.tsx      # 主 Composition
│               ├── SlideRenderer.tsx
│               └── components/
│                   ├── TitleSlide.tsx
│                   ├── ContentSlide.tsx
│                   ├── CardsSlide.tsx
│                   └── HighlightSlide.tsx
├── output/                        # 中间产物目录（gitignore）
│   ├── script.md
│   ├── slides.json
│   ├── audio.mp3
│   └── video.mp4
├── sample.md                      # 示例输入文章
└── .env                           # ANTHROPIC_API_KEY
```

### 流水线流程

```
article.md
    │
    ▼ Step 1：Claude API 改写
output/script.md          ← 可手动编辑，编辑后从 Step 2 继续
    │
    ├──▶ Step 3：TTS 合成 ──▶ output/audio.mp3  （播客成品）
    │
    ▼ Step 2：Claude API 提取结构
output/slides.json        ← 可手动编辑，编辑后直接重新渲染
    │
    ▼ Step 4：Remotion renderMedia
output/video.mp4          （幻灯片 + 音频合成，1920×1080）
```

## 中间产物设计

### output/script.md

LLM 将原始文章改写为口语化旁白脚本：

```markdown
---
title: AI Agent 的前世今生
slide_markers:
  - intro
  - what-is-agent
  - core-tech
  - use-cases
  - future
---

<!-- SLIDE: intro -->
好，今天我们来聊一个最近特别火的话题——AI Agent。
你可能已经听过这个词很多次了，但它到底是什么意思？
它跟我们平时用的 ChatGPT 又有什么不一样？

<!-- SLIDE: what-is-agent -->
简单说，AI Agent 就像一个能独立完成任务的「数字员工」。
你给它一个目标，它会自己想办法——规划步骤、调用工具、处理意外，
最后把结果交给你。...
```

改写规则（LLM Prompt 约束）：
- 加过渡词："接下来"、"那么"、"说到这里"
- 长句拆短，加省略号表停顿
- 每个 `<!-- SLIDE: id -->` 对应一张幻灯片的旁白段落
- 不直接朗读原文，改为口语化解释

### output/slides.json

```json
{
  "title": "AI Agent 的前世今生",
  "slides": [
    {
      "id": "intro",
      "type": "title",
      "title": "AI Agent 的前世今生",
      "subtitle": "从对话到行动的跨越"
    },
    {
      "id": "what-is-agent",
      "type": "content",
      "title": "什么是 AI Agent？",
      "points": [
        "能独立完成任务的「数字员工」",
        "自主规划步骤、调用工具、处理异常",
        "不只是回答问题——真正「做事」"
      ]
    },
    {
      "id": "core-tech",
      "type": "cards",
      "title": "核心技术",
      "cards": [
        { "icon": "🧠", "label": "大语言模型", "desc": "作为「大脑」负责理解推理" },
        { "icon": "🔧", "label": "工具调用", "desc": "操作外部系统" },
        { "icon": "💾", "label": "记忆系统", "desc": "短期和长期记忆" },
        { "icon": "📋", "label": "规划能力", "desc": "把复杂任务分解为步骤" }
      ]
    },
    {
      "id": "future",
      "type": "highlight",
      "title": "未来展望",
      "quote": "从「能对话」走向「能行动」",
      "body": "未来每个人都会有一个专属 AI Agent"
    }
  ]
}
```

Slide 类型：
| 类型 | 用途 |
|------|------|
| `title` | 封面，大标题 + 副标题 |
| `content` | 条目列表，带 ✓ 图标 |
| `cards` | 彩色卡片横排（4-5 个） |
| `highlight` | 核心金句 + 说明文字 |

### 幻灯片时序计算

Remotion 读取 `audio.mp3` 总时长，按各 slide 对应段落字数比例分配帧数：

```ts
const totalFrames = audioLengthInSeconds * fps
const weights = slides.map(s => charCountOf(s.id, script))
const totalChars = sum(weights)

slides.forEach((slide, i) => {
  slide.startFrame = Math.round(cumSum(weights, i) / totalChars * totalFrames)
  slide.endFrame   = Math.round(cumSum(weights, i + 1) / totalChars * totalFrames)
})
```

## 技术栈

### pipeline/

| 职责 | 选型 |
|------|------|
| CLI 框架 | `cac` |
| LLM | Claude API（`claude-sonnet-4-6`） |
| TTS | 可插拔接口，当前占位用 `edge-tts`（**待调研替换**） |
| 音频拼接 | `ffmpeg` 子进程 |
| 运行时 | Node.js + `tsx`（直接运行 TypeScript） |
| 配置 | `.env` → `ANTHROPIC_API_KEY` |

### remotion-player/

| 职责 | 选型 |
|------|------|
| 视频框架 | `@remotion/core` |
| 渲染 | `@remotion/cli` renderMedia |
| 样式 | Tailwind CSS（内联） |
| 字体 | `Noto Sans SC`（Google Fonts，中文） |
| 音频同步 | Remotion `<Audio>` 组件 |
| 输出 | H.264 MP4，1920×1080，30fps |

### TTS 接口（可插拔）

```ts
// pipeline/src/tts/interface.ts
interface TTSProvider {
  synthesize(text: string, outputPath: string): Promise<void>
}
```

**待调研方案**（Task #7）：豆包（火山引擎）、MiniMax、讯飞、Fish Audio、CosyVoice

## CLI 使用方式

```bash
# 全流程一键跑
cd pipeline
npm run generate -- --input=../sample.md

# 编辑 script.md 后，从 Step 2 继续
npm run generate -- --input=../sample.md --from=2

# 编辑 slides.json 后，只重新渲染视频
npm run render

# Remotion Studio 实时预览幻灯片
cd remotion-player
npx remotion studio
```

Step 运行逻辑：
- 对应产物文件已存在 → 跳过（幂等）
- `--from=N` → 从第 N 步开始，强制重跑后续步骤
- `--force` → 忽略已有产物，全部重跑

## 待定事项

- [ ] **TTS 方案选型**（Task #7）：调研豆包/MiniMax/讯飞等中文 TTS，替换 edge-tts 占位实现
- [ ] **Anthropic API Key**：用户需在 `console.anthropic.com` 创建
