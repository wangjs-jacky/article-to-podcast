# article-to-podcast 设计文档

> 输入一篇 Markdown 文章，自动产出播客（MP3）和讲解视频（MP4），每个流水线步骤输出可编辑的中间产物。

## 目标

- 输入：Markdown 格式文章
- 输出：`audio.mp3`（播客）+ `video.mp4`（幻灯片讲解视频）
- 自动化：默认全流程一键跑通，支持修改中间产物后从指定步骤重跑

## 参考风格分析

参考视频：[探索未至之境 - Karpathy AI 编程准则解读](https://www.bilibili.com/video/BV19gQhBqENu)（7.7 分钟）

### 视觉风格

- 纯白背景（`#ffffff`），无渐变无纹理
- 无衬线字体，推荐 `Noto Sans SC`（中文）
- PPT 幻灯片式布局，每节一屏
- 彩色卡片 + 图标区分信息（蓝/红/绿/橙对应不同语义）
- 底部黑底白字字幕条（`rgba(0,0,0,0.8)`，`border-radius: 4px`）

### Remotion 动画规格

从截图逐帧分析得出的具体动画参数：

| 元素 | 动画类型 | 参数 |
|------|---------|------|
| 幻灯片整体 | 淡入切换 | `opacity: 0→1`，duration 20帧 |
| 标题文字 | 淡入 + 轻微缩放 | `opacity: 0→1`，`scale: 1.05→1`，delay 0帧，duration 30帧 |
| 列表条目 | 从左滑入（逐条） | `translateX: -50→0`，每条 delay +15帧，duration 20帧 |
| 未激活条目 | 灰色，激活时切换 | 颜色 `#ccc→#000`，`transition 0.3s` |
| Cards 横排 | 从左到右依次淡入 | 每卡 delay +12帧，`opacity: 0→1`，duration 20帧 |
| 底部字幕条 | 从下弹出 | `translateY: 50→0`，duration 20帧 |
| 背景 | 静态纯白 | 无动画 |

动画曲线全部使用 `spring({ frame, fps, config: { damping: 15 } })`。

### Cards 布局 CSS 规格

```css
/* 5卡横排 */
display: flex; gap: 40px; justify-content: center;
/* 单卡 */
width: 340px; padding: 20px; border-radius: 8px;
border: 1px solid #e0e0e0; background: rgba(240,248,255,0.5);
/* 图标+文字：左右排列 */
display: flex; align-items: center; gap: 12px;
```

### 左右对比布局 CSS 规格

```css
/* 容器 */
display: flex; gap: 20px;
/* 左侧（正确，55%）*/
flex: 0 0 55%; border: 1px solid rgba(100,150,200,0.5);
background: rgba(230,240,255,0.3); border-radius: 12px; padding: 16px 20px;
/* 右侧（40%，上下两卡）*/
flex: 0 0 40%; display: flex; flex-direction: column; gap: 15px;
/* ✓ 图标颜色 */
color: #007bff;
/* ✗ 图标颜色 */
color: #dc3545;
```

### 口播脚本结构规范

通过分析参考视频逐字稿（已提取）和慢学AI 13篇样本，总结出高质量口播视频的脚本结构：

```
## 开场（~30秒，1个 SLIDE）
- 直接抛核心问题/现象，不寒暄
- 结尾用设悬念句："为什么X能做到Y？"

## 背景铺垫（~60秒，1-2个 SLIDE）
- 解释为什么值得关注
- 引出主角（人/工具/概念）
- 关键数据或背书（"获得763万次浏览"）

## 核心内容（~4分钟，3-5个 SLIDE，每个SLIDE对应一条原则）
每条结构：
  - 标题句（点出核心，8字内）
  - 原话/原文引用（增加可信度）
  - 口语化解释（"简单说就是..."）
  - 具体例子（"举个例子，用户说X，错误做法是...，正确做法是..."）
  - 正误对比（可选，对应 comparison 类型 Slide）

## 总结收尾（~30秒，1个 SLIDE）
- 提炼核心公式或1-3条行动建议
- 简洁收尾，不冗余
```

**口语化改写规则（Step 1 LLM Prompt 约束）：**
- 加过渡词：「接下来」「那么」「说到这里」「简单说就是」
- 用「举个例子」引出具体案例
- 避免连续专业术语，每出现一个术语后跟口语解释
- 长句拆短（每句不超过30字）
- 适当停顿标记（「……」）
- 参考字数：每分钟约200字，7分钟视频约1400字

**参考视频逐字稿节选（作为 LLM Prompt 的 few-shot 示例）：**

```
开场示例：
"本期节目我们来聊一个GitHub上超过16000stars的项目。
它的核心就是一个65行的Markdown文件。
一个Markdown文件凭什么能拿到16000颗星？
因为它解决了一个所有AI编程用户都头疼的问题。"

正误对比示例：
"举个例子，用户说添加用户导出功能。
错误做法是，AI直接假设导出全部用户，写到本地文件，用JSON格式。
正确做法是，先问清楚：导出范围是全部还是筛选后的？
输出到浏览器下载还是后台任务？包含哪些字段？数据量多大？"

总结示例：
"简单说，这个项目火的公式是：真实痛点 + 名人背书 + 极简方案 + 完善案例。"
```

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

步骤严格顺序执行（Step 3 依赖 Step 2 的产物做 ID 校验并回写时间戳）：

```
article.md
    │
    ▼ Step 1：Claude API 改写
output/script.md                ← 可编辑，编辑后 --from=2 重跑
    │
    ▼ Step 2：Claude API 提取幻灯片结构
output/slides.json（无时间戳）  ← 可编辑内容，编辑后 --from=3 重跑
    │
    ▼ Step 3：TTS 分段合成 + 写入时间戳
output/audio.mp3（播客成品）
output/slides.json（补充 startSec/endSec）
    │
    ▼ Step 4：Remotion renderMedia
output/video.mp4                （幻灯片 + 音频，1920×1080）
```

**注意**：Step 3 同时产出 audio.mp3 和更新 slides.json 时间戳，是 Step 4 的前置依赖。`npm run render` 等价于 `--from=4`，要求 slides.json 中已存在 startSec/endSec 字段（即 Step 3 已成功执行过）。

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

### 幻灯片时序计算（pipeline 侧写入，非 Remotion 运行时计算）

Step 3（TTS）按 `<!-- SLIDE: id -->` 分段分别合成音频，记录每段实际时长后拼接为 `audio.mp3`，并将真实时间戳写回 `slides.json`：

```
script.md 按 SLIDE 标记拆分
  → 每段单独调用 TTS API → segment_intro.mp3 (3.2s), segment_what-is-agent.mp3 (8.7s), ...
  → ffmpeg 拼接 → output/audio.mp3
  → 将实际秒数写入 slides.json 的 startSec / endSec 字段
```

`slides.json` 最终包含精确时间戳（单位：秒）：

```json
{ "id": "intro",         "startSec": 0.0,  "endSec": 3.2  }
{ "id": "what-is-agent", "startSec": 3.2,  "endSec": 11.9 }
```

Remotion 的 `<Audio>` 组件直接使用完整 `audio.mp3`，幻灯片切换时间由 `startSec × fps` 转为帧数，精确对齐音频。

### Slide ID 一致性校验

Step 3 拆分脚本时，校验 `<!-- SLIDE: id -->` 中的所有 id 是否与 `slides.json` 中的 `slides[].id` 完全匹配（顺序 + 数量），不一致则报错退出，不进行 TTS 合成。

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
  // 合成单段文字为音频文件，返回实际时长（秒）
  synthesize(text: string, outputPath: string): Promise<number>
}
```

**当前占位**：[`edge-tts`](https://www.npmjs.com/package/edge-tts)（npm 包，纯 Node.js，无 Python 依赖，免费），不阻塞流程开发，TTS 实现可随时热换。  
**待调研替换方案**（Task #7）：豆包（火山引擎）、MiniMax、讯飞、Fish Audio、CosyVoice

### Remotion 音频文件引用

Remotion 渲染时本地文件需通过 `staticFile()` 引用：

```ts
// remotion-player/src/compositions/ArticleVideo/index.tsx
import { Audio, staticFile } from 'remotion'

// audio.mp3 须放置于 remotion-player/public/audio.mp3
<Audio src={staticFile('audio.mp3')} />
```

`npm run render` 在触发 renderMedia 前自动将 `output/audio.mp3` 复制到 `remotion-player/public/audio.mp3`。

## CLI 使用方式

```bash
# 全流程一键跑（Step 1 → 2 → 3 → 4）
cd pipeline
npm run generate -- --input=../sample.md

# 编辑 script.md 后，从 Step 2 重跑
npm run generate -- --input=../sample.md --from=2

# 编辑 slides.json 内容（保留时间戳）后，只重新渲染视频
# 等价于 --from=4，要求 slides.json 已有 startSec/endSec
cd pipeline && npm run render

# 编辑 slides.json 内容并删除了时间戳，需从 Step 3 重跑
npm run generate -- --input=../sample.md --from=3

# Remotion Studio 实时预览幻灯片（开发阶段调试布局用）
cd remotion-player
npx remotion studio
```

`npm run render`（pipeline 侧命令）内部调用 `remotion render`，将 `output/audio.mp3` 复制到 `remotion-player/public/audio.mp3`，然后触发 `@remotion/cli` 的 `renderMedia`，输出到 `output/video.mp4`。

Step 运行逻辑（优先级由高到低）：
1. `--force` → 忽略所有已有产物，全部重跑
2. `--from=N` → 强制重跑第 N 步及后续步骤，无论产物是否存在
3. 默认 → 对应产物文件已存在则跳过该步骤（幂等）

即 `--from=N` 隐含"N 步之后不再检查产物是否存在"。

## 待定事项

- [ ] **TTS 方案选型**（Task #7）：调研豆包/MiniMax/讯飞等中文 TTS，替换 edge-tts 占位实现
- [ ] **Anthropic API Key**：用户需在 `console.anthropic.com` 创建
