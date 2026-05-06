---
name: article-to-podcast
description: 将 Markdown 文章转换为口播播客（MP3）和幻灯片讲解视频（MP4）
args: "<input-file> [--from=N]"
---

# Article to Podcast

将 Markdown 文章自动转换为口播播客和幻灯片视频，每步产出可编辑的中间产物。

## 参数

- `<input-file>` — 输入 Markdown 文件路径（相对于项目根目录）
- `--from=N` — 从第 N 步开始（默认 1）
- `--duration=S` — 目标视频时长（秒），默认 60；决定口播脚本字数（公式：目标字数 = S × 5）

| N | 含义 |
|---|------|
| 1 | 文章 → 口播脚本（output/script.md）|
| 2 | 脚本 → 幻灯片 JSON（output/slides.json）|
| 3 | TTS 合成（output/audio.mp3）|
| 4 | Remotion 渲染（output/video.mp4）|

### 时长与字数对照

| 目标时长 | 目标字数（5字/秒） |
|----------|-------------------|
| 30s | ~150 字 |
| 60s | ~300 字（默认） |
| 120s | ~600 字 |
| 300s | ~1500 字 |

## 中间产物

| 产物 | 路径 |
|------|------|
| 口播脚本 | `output/script.md` |
| 幻灯片 JSON | `output/slides.json` |
| 播客音频 | `output/audio.mp3` |
| 讲解视频 | `output/video.mp4` |

---

## 执行流程

**开始前：**
1. 解析 `<input-file>` 路径、`--from` 值（默认 1）和 `--duration` 值（默认 60）
2. 计算目标字数：`target_words = duration × 5`（例如 60s → 300 字，30s → 150 字）
3. 运行 `mkdir -p output` 确保输出目录存在

---

### Step 1：文章 → 口播脚本

**触发条件：** `--from <= 1`（若 `output/script.md` 已存在且 `--from > 1` 则跳过）

读取 `<input-file>`，按以下规则改写为口播视频脚本，直接写入 `output/script.md`。

**改写规则：**
- 改写为口语化旁白，不直接朗读原文，像在做视频讲解
- 每句不超过 30 字，长句拆短，适合 TTS 播报
- 使用过渡词：「接下来」「那么」「说到这里」「简单说就是」
- 用「举个例子」引出具体案例
- 每出现专业术语后紧接口语解释
- **全文字数严格控制在 `target_words` 字左右**（由 `--duration` 参数决定，默认 60s → 约 300 字）
  - 字数计算公式：`target_words = duration × 5`（普通语速 5 字/秒）
  - 若用户传入 `--duration=30`，则全文约 150 字；`--duration=120` 则约 600 字
  - 字数不足时不要凑字，多余时要大胆删减，**宁可字少也不超时**
- 结构根据字数自适应：
  - ≤150 字（≤30s）：开场 → 核心观点 → 总结（3个 slide）
  - 150-600 字（30-120s）：开场 → 背景（1个）→ 核心内容（1-3个）→ 总结（3-5个 slide）
  - >600 字（>120s）：开场 → 背景（1-2个）→ 核心内容（3-5个）→ 总结（5-8个 slide）

**输出格式（严格遵守）：**

```
---
title: 文章标题
slide_markers:
  - intro
  - background
  - core-concept
  - applications
  - summary
---

<!-- SLIDE: intro -->
今天我们来聊一个问题——XXX 到底是什么。
你可能已经听过这个词很多次了……

<!-- SLIDE: background -->
……
```

- `slide_markers` 列表必须与正文中的 `<!-- SLIDE: id -->` 标记一一对应，顺序一致
- ID 使用英文 kebab-case，如 `core-concept`、`tech-stack`

---

### Step 2：脚本 → 幻灯片 JSON

**触发条件：** `--from <= 2`（若 `output/slides.json` 已存在且 `--from > 2` 则跳过）

读取 `output/script.md`，根据每个 `<!-- SLIDE: id -->` 段落内容，提取关键信息生成 JSON，写入 `output/slides.json`。

**幻灯片类型选择规则：**

| 场景 | 类型 |
|------|------|
| 第一个 SLIDE（标题封面） | `"title"` |
| 列举要点（3-6条） | `"content"` |
| 并列介绍 4-5 个概念 | `"cards"` |
| 金句/核心理念 | `"highlight"` |
| 两种方案正反对比 | `"comparison"` |

**JSON Schema：**

```json
{
  "title": "文章主标题",
  "slides": [
    {
      "id": "intro",
      "type": "title",
      "title": "主标题",
      "subtitle": "可选副标题"
    },
    {
      "id": "core-concept",
      "type": "content",
      "title": "章节标题",
      "points": ["要点一", "要点二", "要点三"]
    },
    {
      "id": "tech-stack",
      "type": "cards",
      "title": "章节标题",
      "cards": [
        { "icon": "🧠", "label": "名称", "desc": "简短描述" }
      ]
    },
    {
      "id": "summary",
      "type": "highlight",
      "title": "总结",
      "quote": "核心金句",
      "body": "可选补充说明"
    }
  ]
}
```

**注意事项：**
- 每个 slide 的 `id` 必须与 `script.md` 中的标记完全一致
- 输出纯 JSON，不加 markdown 代码块包裹
- **不填写** `startSec`/`endSec` 字段（由 Step 3 写入）

---

### Step 3：TTS 合成

**触发条件：** `--from <= 3`

运行以下命令（在项目根目录下）：

```bash
cd pipeline && npm run tts
```

等待命令完成。确认 `output/audio.mp3` 存在后继续。

---

### Step 4：视频渲染

**触发条件：** `--from <= 4`

运行以下命令（在项目根目录下）：

```bash
cd pipeline && npm run render
```

等待渲染完成。确认 `output/video.mp4` 存在后继续。

---

## 完成后报告

列出产出文件路径和大小：
- `output/script.md`
- `output/slides.json`
- `output/audio.mp3`
- `output/video.mp4`
