# Article to Podcast Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 输入 Markdown 文章，自动产出口播风格播客（MP3）和幻灯片讲解视频（MP4），每步生成可编辑中间产物。

**Architecture:** 两个独立子项目通过文件系统交互：`pipeline/`（TypeScript CLI）负责 AI 步骤（脚本改写→幻灯片 JSON→TTS），`remotion-player/`（React/Remotion）负责视频渲染。中间产物保存在根目录 `output/` 下，支持 `--from=N` 从指定步骤重跑。

**Tech Stack:** Node.js + TypeScript + tsx，Anthropic SDK（claude-sonnet-4-6），edge-tts（TTS 占位），ffmpeg（音频拼接），Remotion（视频渲染），vitest（测试）

---

## Chunk 1: 项目脚手架 + 共享类型 + 脚本解析器

### Task 1: 初始化 pipeline/ 项目

**Files:**
- Create: `pipeline/package.json`
- Create: `pipeline/tsconfig.json`
- Create: `pipeline/.env.example`
- Create: `pipeline/src/types.ts`

- [ ] **Step 1: 创建 pipeline/ 目录并初始化**

```bash
mkdir -p pipeline/src/tts pipeline/src/__tests__
cd pipeline
npm init -y
npm install anthropic @anthropic-ai/sdk edge-tts cac dotenv gray-matter
npm install -D typescript tsx vitest @types/node
```

- [ ] **Step 2: 写 tsconfig.json**

```json
// pipeline/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 更新 pipeline/package.json scripts**

```json
{
  "type": "module",
  "scripts": {
    "generate": "tsx src/index.ts",
    "render": "tsx src/render.ts",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: 创建 .env.example**

```
# pipeline/.env.example
ANTHROPIC_API_KEY=your_key_here
```

- [ ] **Step 5: 写共享类型 `pipeline/src/types.ts`**

```ts
// pipeline/src/types.ts

export interface Card {
  icon: string
  label: string
  desc: string
}

export interface ComparisonSide {
  label: string
  items: string[]
}

export type SlideType = 'title' | 'content' | 'cards' | 'highlight' | 'comparison'

export interface BaseSlide {
  id: string
  type: SlideType
  startSec?: number
  endSec?: number
}

export interface TitleSlide extends BaseSlide {
  type: 'title'
  title: string
  subtitle?: string
}

export interface ContentSlide extends BaseSlide {
  type: 'content'
  title: string
  points: string[]
}

export interface CardsSlide extends BaseSlide {
  type: 'cards'
  title: string
  cards: Card[]
}

export interface HighlightSlide extends BaseSlide {
  type: 'highlight'
  title: string
  quote: string
  body?: string
}

export interface ComparisonSlide extends BaseSlide {
  type: 'comparison'
  title: string
  correct: ComparisonSide
  wrong: ComparisonSide
}

export type Slide = TitleSlide | ContentSlide | CardsSlide | HighlightSlide | ComparisonSlide

export interface SlidesJson {
  title: string
  slides: Slide[]
}

export interface ScriptFrontmatter {
  title: string
  slide_markers: string[]
}

export interface ScriptSegment {
  id: string
  text: string
}
```

- [ ] **Step 6: Commit**

```bash
git add pipeline/
git commit -m "feat: initialize pipeline project with types"
```

---

### Task 2: 初始化 remotion-player/ 项目

**Files:**
- Create: `remotion-player/package.json`
- Create: `remotion-player/tsconfig.json`
- Create: `remotion-player/remotion.config.ts`
- Create: `remotion-player/src/types.ts`
- Create: `remotion-player/src/Root.tsx`
- Create: `remotion-player/public/.gitkeep`

- [ ] **Step 1: 创建 remotion-player/ 并安装依赖**

```bash
mkdir -p remotion-player/src/compositions/ArticleVideo/components remotion-player/public
cd remotion-player
npm init -y
npm install remotion @remotion/core @remotion/cli @remotion/renderer react react-dom
npm install -D typescript @types/react @types/react-dom
```

- [ ] **Step 2: 写 remotion-player/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 写 remotion-player/remotion.config.ts**

```ts
// remotion-player/remotion.config.ts
import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
```

- [ ] **Step 4: 复制类型定义到 remotion-player/src/types.ts**

将 `pipeline/src/types.ts` 中的 `Slide`、`SlidesJson` 等类型完整复制过来（两个项目各自独立，不共享 node_modules）。

- [ ] **Step 5: 创建占位 Root.tsx**

```tsx
// remotion-player/src/Root.tsx
import { Composition } from 'remotion'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ArticleVideo"
        component={() => <div>placeholder</div>}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
```

- [ ] **Step 6: 创建 public/.gitkeep，更新 .gitignore**

```bash
touch remotion-player/public/.gitkeep
echo "remotion-player/public/audio.mp3" >> .gitignore
echo "output/" >> .gitignore
echo ".env" >> .gitignore
```

- [ ] **Step 7: Commit**

```bash
git add remotion-player/ .gitignore
git commit -m "feat: initialize remotion-player project"
```

---

### Task 3: 脚本解析器

解析 `script.md` 的核心工具，被 Step 2 和 Step 3 共用。

**Files:**
- Create: `pipeline/src/parser.ts`
- Create: `pipeline/src/__tests__/parser.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// pipeline/src/__tests__/parser.test.ts
import { describe, it, expect } from 'vitest'
import { parseScript } from '../parser.js'

const SAMPLE_SCRIPT = `---
title: AI Agent 的前世今生
slide_markers:
  - intro
  - what-is-agent
---

<!-- SLIDE: intro -->
好，今天我们来聊 AI Agent。
它是什么？

<!-- SLIDE: what-is-agent -->
AI Agent 就像数字员工。
你给它目标，它自己想办法。
`

describe('parseScript', () => {
  it('解析 frontmatter 标题和 slide_markers', () => {
    const result = parseScript(SAMPLE_SCRIPT)
    expect(result.frontmatter.title).toBe('AI Agent 的前世今生')
    expect(result.frontmatter.slide_markers).toEqual(['intro', 'what-is-agent'])
  })

  it('按 SLIDE 注释分割段落', () => {
    const result = parseScript(SAMPLE_SCRIPT)
    expect(result.segments).toHaveLength(2)
    expect(result.segments[0].id).toBe('intro')
    expect(result.segments[0].text).toContain('AI Agent')
    expect(result.segments[1].id).toBe('what-is-agent')
  })
})

describe('splitIntoSegments', () => {
  it('段落 id 与 slide_markers 不一致时抛出错误', () => {
    const badScript = `---
title: test
slide_markers:
  - intro
  - missing-slide
---

<!-- SLIDE: intro -->
文本内容
`
    expect(() => parseScript(badScript)).toThrow('SLIDE ID 不匹配')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd pipeline && npx vitest run src/__tests__/parser.test.ts
```
预期：FAIL，`parser.ts` 不存在

- [ ] **Step 3: 实现 parser.ts**

```ts
// pipeline/src/parser.ts
import matter from 'gray-matter'
import type { ScriptFrontmatter, ScriptSegment } from './types.js'

export interface ParsedScript {
  frontmatter: ScriptFrontmatter
  segments: ScriptSegment[]
}

export function parseScript(content: string): ParsedScript {
  const { data, content: body } = matter(content)
  const frontmatter = data as ScriptFrontmatter

  // 按 <!-- SLIDE: id --> 分割，保留空文本段落
  const slideRegex = /<!--\s*SLIDE:\s*(\S+)\s*-->/g
  const parts = body.split(slideRegex)
  // split 结果：[前置内容, id1, text1, id2, text2, ...]，第一项为标记前的内容（丢弃）
  const segments: ScriptSegment[] = []
  for (let i = 1; i < parts.length; i += 2) {
    segments.push({ id: parts[i].trim(), text: (parts[i + 1] ?? '').trim() })
  }

  // 校验 ID 一致性
  const parsedIds = segments.map(s => s.id)
  const expectedIds = frontmatter.slide_markers
  const mismatch = parsedIds.some((id, i) => id !== expectedIds[i])
    || parsedIds.length !== expectedIds.length

  if (mismatch) {
    throw new Error(
      `SLIDE ID 不匹配：script.md 中的 [${parsedIds}] 与 slides.json 中的 [${expectedIds}] 不一致`
    )
  }

  return { frontmatter, segments }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd pipeline && npx vitest run src/__tests__/parser.test.ts
```
预期：PASS，2 个测试通过

- [ ] **Step 5: Commit**

```bash
git add pipeline/src/parser.ts pipeline/src/__tests__/parser.test.ts
git commit -m "feat: add script parser with SLIDE marker splitting and ID validation"
```

---

## Chunk 2: Pipeline AI 步骤（Step 1 + Step 2 + TTS 接口）

### Task 4: TTS 接口 + edge-tts 实现

**Files:**
- Create: `pipeline/src/tts/interface.ts`
- Create: `pipeline/src/tts/edge-tts.ts`
- Create: `pipeline/src/__tests__/tts.test.ts`

- [ ] **Step 1: 写 TTS 接口**

```ts
// pipeline/src/tts/interface.ts
export interface TTSProvider {
  /**
   * 合成单段文字为音频文件
   * @returns 实际音频时长（秒）
   */
  synthesize(text: string, outputPath: string): Promise<number>
}
```

- [ ] **Step 2: 写 edge-tts 实现**

```ts
// pipeline/src/tts/edge-tts.ts
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import type { TTSProvider } from './interface.js'

export class EdgeTTSProvider implements TTSProvider {
  private voice: string

  constructor(voice = 'zh-CN-YunxiNeural') {
    this.voice = voice
  }

  async synthesize(text: string, outputPath: string): Promise<number> {
    // edge-tts CLI：edge-tts --voice zh-CN-YunxiNeural --text "..." --write-media output.mp3
    const escaped = text.replace(/"/g, '\\"')
    execSync(
      `edge-tts --voice ${this.voice} --text "${escaped}" --write-media "${outputPath}"`,
      { stdio: 'pipe' }
    )

    if (!existsSync(outputPath)) {
      throw new Error(`TTS 输出文件未生成：${outputPath}`)
    }

    // 用 ffprobe 获取实际时长
    const result = execSync(
      `ffprobe -v quiet -print_format json -show_format "${outputPath}"`,
      { encoding: 'utf8' }
    )
    const { format } = JSON.parse(result)
    return parseFloat(format.duration)
  }
}
```

- [ ] **Step 3: 写 TTS 集成测试（跳过 CI，仅本地运行）**

```ts
// pipeline/src/__tests__/tts.test.ts
import { describe, it, expect } from 'vitest'
import { EdgeTTSProvider } from '../tts/edge-tts.js'
import { existsSync, unlinkSync } from 'fs'

describe.skip('EdgeTTSProvider（需要 edge-tts CLI）', () => {
  it('合成短文字并返回时长', async () => {
    const tts = new EdgeTTSProvider()
    const outPath = '/tmp/tts-test.mp3'
    const duration = await tts.synthesize('你好世界', outPath)
    expect(existsSync(outPath)).toBe(true)
    expect(duration).toBeGreaterThan(0)
    unlinkSync(outPath)
  }, 30000)
})
```

- [ ] **Step 4: Commit**

```bash
git add pipeline/src/tts/ pipeline/src/__tests__/tts.test.ts
git commit -m "feat: add TTSProvider interface and edge-tts implementation"
```

---

### Task 5: Step 1 — 文章 → 口播脚本

**Files:**
- Create: `pipeline/src/step1-script.ts`
- Create: `pipeline/src/__tests__/step1.test.ts`

- [ ] **Step 1: 写失败测试（mock Claude API）**

```ts
// pipeline/src/__tests__/step1.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateScript } from '../step1-script.js'

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: `---
title: 测试文章
slide_markers:
  - intro
  - main
---

<!-- SLIDE: intro -->
这是开场白。

<!-- SLIDE: main -->
这是正文内容。
` }]
      })
    }
  }
}))

describe('generateScript', () => {
  it('返回包含 SLIDE 标记的 Markdown 脚本', async () => {
    const result = await generateScript('# 测试文章\n正文内容', 'fake-key')
    expect(result).toContain('<!-- SLIDE:')
    expect(result).toContain('slide_markers:')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd pipeline && npx vitest run src/__tests__/step1.test.ts
```

- [ ] **Step 3: 实现 step1-script.ts**

```ts
// pipeline/src/step1-script.ts
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `你是一位专业的科技内容创作者，擅长将技术文章改写为口播视频脚本。

改写规则：
- 将文章改写为口语化旁白，不直接朗读原文
- 每句不超过30字，长句拆短
- 加过渡词：「接下来」「那么」「说到这里」「简单说就是」
- 用「举个例子」引出具体案例
- 每出现专业术语后跟口语解释
- 适当用「……」表示停顿

输出格式（严格遵守）：
1. 开头是 YAML frontmatter，包含 title 和 slide_markers 列表
2. 每个段落前有 <!-- SLIDE: id --> 注释，id 与 slide_markers 中一一对应
3. 全视频约 1400 字（约 7 分钟）
4. 结构：开场(1个SLIDE) → 背景铺垫(1-2个SLIDE) → 核心内容(3-5个SLIDE) → 总结(1个SLIDE)

参考示例开场：
"本期节目我们来聊一个问题——AI Agent 到底是什么。
你可能已经听过这个词很多次了，但它跟我们平时用的 ChatGPT 又有什么不一样？"`

export async function generateScript(
  articleContent: string,
  apiKey: string
): Promise<string> {
  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `请将以下文章改写为口播视频脚本：\n\n${articleContent}`
      }
    ]
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('LLM 返回非文本内容')
  return block.text
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd pipeline && npx vitest run src/__tests__/step1.test.ts
```
预期：PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/src/step1-script.ts pipeline/src/__tests__/step1.test.ts
git commit -m "feat: add step1 article-to-script via Claude API"
```

---

### Task 6: Step 2 — 脚本 → 幻灯片 JSON

**Files:**
- Create: `pipeline/src/step2-slides.ts`
- Create: `pipeline/src/__tests__/step2.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// pipeline/src/__tests__/step2.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateSlides } from '../step2-slides.js'
import type { SlidesJson } from '../types.js'

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({
          title: '测试文章',
          slides: [
            { id: 'intro', type: 'title', title: '测试文章', subtitle: '副标题' },
            { id: 'main', type: 'content', title: '主要内容', points: ['要点一', '要点二'] }
          ]
        } as SlidesJson) }]
      })
    }
  }
}))

describe('generateSlides', () => {
  it('返回有效的 SlidesJson 对象', async () => {
    const script = `---
title: 测试
slide_markers: [intro, main]
---
<!-- SLIDE: intro -->文字
<!-- SLIDE: main -->文字`

    const result = await generateSlides(script, 'fake-key')
    expect(result.title).toBe('测试文章')
    expect(result.slides).toHaveLength(2)
    expect(result.slides[0].type).toBe('title')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd pipeline && npx vitest run src/__tests__/step2.test.ts
```

- [ ] **Step 3: 实现 step2-slides.ts**

```ts
// pipeline/src/step2-slides.ts
import Anthropic from '@anthropic-ai/sdk'
import type { SlidesJson } from './types.js'

const SYSTEM_PROMPT = `你是幻灯片内容提取专家。根据口播脚本，提取每个章节的关键内容，生成幻灯片 JSON。

幻灯片类型规则：
- 第一个 SLIDE → type: "title"（大标题封面）
- 列举多个要点 → type: "content"（带✓图标的列表）
- 并列介绍4-5个概念 → type: "cards"（彩色卡片横排）
- 金句/核心理念 → type: "highlight"（大字引用）
- 正确vs错误对比 → type: "comparison"（左右分栏）
- 总结章节 → type: "content" 或 "highlight"

输出纯 JSON，不要任何 markdown 代码块包裹。`

export async function generateSlides(
  scriptContent: string,
  apiKey: string
): Promise<SlidesJson> {
  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `根据以下口播脚本，生成幻灯片 JSON：\n\n${scriptContent}`
      }
    ]
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('LLM 返回非文本内容')

  try {
    return JSON.parse(block.text) as SlidesJson
  } catch {
    throw new Error(`LLM 返回的 JSON 无效：${block.text.slice(0, 200)}`)
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd pipeline && npx vitest run src/__tests__/step2.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add pipeline/src/step2-slides.ts pipeline/src/__tests__/step2.test.ts
git commit -m "feat: add step2 script-to-slides-json via Claude API"
```

---

### Task 7: Step 3 — TTS 分段合成 + 时间戳写回

**Files:**
- Create: `pipeline/src/step3-tts.ts`
- Create: `pipeline/src/__tests__/step3.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// pipeline/src/__tests__/step3.test.ts
import { describe, it, expect, vi } from 'vitest'
import { synthesizeAndTimestamp } from '../step3-tts.js'
import type { SlidesJson } from '../types.js'

// Mock TTSProvider
const mockTTS = {
  synthesize: vi.fn()
    .mockResolvedValueOnce(3.2)  // intro: 3.2s
    .mockResolvedValueOnce(8.7)  // main: 8.7s
}

// Mock ffmpeg concat (execSync)
vi.mock('child_process', () => ({
  execSync: vi.fn()
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, writeFileSync: vi.fn(), copyFileSync: vi.fn() }
})

describe('synthesizeAndTimestamp', () => {
  it('为每个 slide 写入正确的 startSec/endSec', async () => {
    const slides: SlidesJson = {
      title: '测试',
      slides: [
        { id: 'intro', type: 'title', title: '测试', subtitle: '' },
        { id: 'main', type: 'content', title: '主要内容', points: [] }
      ]
    }
    const segments = [
      { id: 'intro', text: '开场文字' },
      { id: 'main', text: '正文文字' }
    ]

    const result = await synthesizeAndTimestamp(
      segments, slides, mockTTS as any, '/tmp/test-output'
    )

    expect(result.slides[0].startSec).toBe(0)
    expect(result.slides[0].endSec).toBeCloseTo(3.2)
    expect(result.slides[1].startSec).toBeCloseTo(3.2)
    expect(result.slides[1].endSec).toBeCloseTo(11.9)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd pipeline && npx vitest run src/__tests__/step3.test.ts
```

- [ ] **Step 3: 实现 step3-tts.ts**

```ts
// pipeline/src/step3-tts.ts
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { TTSProvider } from './tts/interface.js'
import type { ScriptSegment, SlidesJson } from './types.js'

export async function synthesizeAndTimestamp(
  segments: ScriptSegment[],
  slides: SlidesJson,
  tts: TTSProvider,
  outputDir: string
): Promise<SlidesJson> {
  mkdirSync(outputDir, { recursive: true })

  const segmentFiles: string[] = []
  let cursor = 0

  const updatedSlides = [...slides.slides]

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const segPath = join(outputDir, `.tmp_seg_${seg.id}.mp3`)
    segmentFiles.push(segPath)

    const duration = await tts.synthesize(seg.text, segPath)

    const slide = updatedSlides.find(s => s.id === seg.id)
    if (slide) {
      slide.startSec = cursor
      slide.endSec = cursor + duration
    }
    cursor += duration
  }

  // ffmpeg concat 拼接所有分段
  const listFile = join(outputDir, '.concat_list.txt')
  writeFileSync(listFile, segmentFiles.map(f => `file '${f}'`).join('\n'))
  const audioOut = join(outputDir, 'audio.mp3')
  execSync(`ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${audioOut}" -y`, { stdio: 'pipe' })

  return { ...slides, slides: updatedSlides }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd pipeline && npx vitest run src/__tests__/step3.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add pipeline/src/step3-tts.ts pipeline/src/__tests__/step3.test.ts
git commit -m "feat: add step3 TTS synthesis with timestamp writing"
```

---

## Chunk 3: Pipeline Orchestrator + Render 命令

### Task 8: CLI 主入口（orchestrator）

**Files:**
- Create: `pipeline/src/index.ts`

- [ ] **Step 1: 实现 CLI 主入口**

```ts
// pipeline/src/index.ts
import { cac } from 'cac'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { config } from 'dotenv'
import { generateScript } from './step1-script.js'
import { generateSlides } from './step2-slides.js'
import { synthesizeAndTimestamp } from './step3-tts.js'
import { parseScript } from './parser.js'
import { EdgeTTSProvider } from './tts/edge-tts.js'
import type { SlidesJson } from './types.js'

config()

const cli = cac('article-to-podcast')

cli
  .command('', '从文章生成播客和视频')
  .option('--input <file>', '输入 Markdown 文章路径')
  .option('--from <step>', '从第几步开始（1-4）', { default: '1' })
  .option('--force', '强制重跑所有步骤')
  .action(async (options: { input: string; from: string; force: boolean }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('缺少 ANTHROPIC_API_KEY 环境变量')

    const inputPath = resolve(options.input)
    const fromStep = parseInt(options.from)
    // outputDir 以项目根目录（pipeline 的上级）为基准，避免依赖 cwd
    const projectRoot = new URL('../../..', import.meta.url).pathname
    const outputDir = join(projectRoot, 'output')
    mkdirSync(outputDir, { recursive: true })

    const scriptPath = join(outputDir, 'script.md')
    const slidesPath = join(outputDir, 'slides.json')
    const audioPath  = join(outputDir, 'audio.mp3')

    const shouldRun = (step: number) => options.force || step >= fromStep

    // Step 1: 文章 → 脚本
    if (shouldRun(1) || !existsSync(scriptPath)) {
      console.log('📝 Step 1: 生成口播脚本...')
      const article = readFileSync(inputPath, 'utf8')
      const script = await generateScript(article, apiKey)
      writeFileSync(scriptPath, script)
      console.log(`✅ 脚本已保存：${scriptPath}`)
    } else {
      console.log('⏭️  Step 1: 脚本已存在，跳过')
    }

    // Step 2: 脚本 → 幻灯片 JSON（无时间戳）
    if (shouldRun(2) || !existsSync(slidesPath)) {
      console.log('🎨 Step 2: 生成幻灯片结构...')
      const script = readFileSync(scriptPath, 'utf8')
      const slides = await generateSlides(script, apiKey)
      writeFileSync(slidesPath, JSON.stringify(slides, null, 2))
      console.log(`✅ 幻灯片 JSON 已保存：${slidesPath}`)
    } else {
      console.log('⏭️  Step 2: slides.json 已存在，跳过')
    }

    // Step 3: TTS + 时间戳写回
    if (shouldRun(3) || !existsSync(audioPath)) {
      console.log('🔊 Step 3: 合成语音并写入时间戳...')
      const script = readFileSync(scriptPath, 'utf8')
      const slides: SlidesJson = JSON.parse(readFileSync(slidesPath, 'utf8'))
      const { segments } = parseScript(script)
      const tts = new EdgeTTSProvider()
      const updatedSlides = await synthesizeAndTimestamp(segments, slides, tts, outputDir)
      writeFileSync(slidesPath, JSON.stringify(updatedSlides, null, 2))
      console.log(`✅ 播客已保存：${audioPath}`)
      console.log(`✅ 时间戳已写入：${slidesPath}`)
    } else {
      console.log('⏭️  Step 3: audio.mp3 已存在，跳过')
    }

    // Step 4: Remotion 渲染
    if (shouldRun(4)) {
      console.log('🎬 Step 4: 渲染视频...')
      const { runRender } = await import('./render.js')
      await runRender(outputDir)
      console.log(`✅ 视频已生成：${join(outputDir, 'video.mp4')}`)
    }

    console.log('\n🎉 完成！')
  })

cli.help()
cli.parse()
```

- [ ] **Step 2: 验证 CLI 帮助信息**

```bash
cd pipeline && tsx src/index.ts --help
```
预期输出包含 `--input`、`--from`、`--force` 选项说明

- [ ] **Step 3: Commit**

```bash
git add pipeline/src/index.ts
git commit -m "feat: add pipeline CLI orchestrator with --from and --force flags"
```

---

### Task 9: Render 命令

**Files:**
- Create: `pipeline/src/render.ts`

- [ ] **Step 1: 实现 render.ts**

```ts
// pipeline/src/render.ts
import { execSync } from 'child_process'
import { copyFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

export async function runRender(outputDir: string): Promise<void> {
  const audioSrc = join(outputDir, 'audio.mp3')
  const slidesSrc = join(outputDir, 'slides.json')
  const remotionDir = new URL('../../remotion-player', import.meta.url).pathname
  const audioDst = join(remotionDir, 'public', 'audio.mp3')
  const videoOut = join(outputDir, 'video.mp4')

  if (!existsSync(audioSrc)) throw new Error(`audio.mp3 不存在，请先运行 Step 3`)
  if (!existsSync(slidesSrc)) throw new Error(`slides.json 不存在，请先运行 Step 2`)

  // 验证 slides.json 包含时间戳
  const { readFileSync: _read } = await import('fs')
  const slides = JSON.parse(_read(slidesSrc, 'utf8'))
  const hasTimestamps = slides.slides.every((s: any) => s.startSec !== undefined)
  if (!hasTimestamps) throw new Error(`slides.json 缺少时间戳，请先运行 Step 3（--from=3）`)

  // 复制音频到 remotion public/
  copyFileSync(audioSrc, audioDst)
  console.log(`  ✓ 音频已复制到 remotion-player/public/`)

  // 读取 slides.json 内容并以 JSON 字符串形式传入
  const { readFileSync: readJson } = await import('fs')
  const propsJson = readJson(slidesSrc, 'utf8')

  // 调用 Remotion CLI 渲染（--props 需要 JSON 字符串，不是文件路径）
  execSync(
    `npx remotion render ArticleVideo "${videoOut}" --props=${JSON.stringify(propsJson)}`,
    { cwd: remotionDir, stdio: 'inherit' }
  )
}

// 直接运行支持
if (process.argv[1]?.endsWith('render.ts')) {
  const outputDir = resolve('../output')
  runRender(outputDir).catch(console.error)
}
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/src/render.ts
git commit -m "feat: add render command that copies audio and triggers Remotion"
```

---

## Chunk 4: Remotion 幻灯片组件

### Task 10: 共享动画工具 + 字幕条

**Files:**
- Create: `remotion-player/src/animations.ts`
- Create: `remotion-player/src/components/Caption.tsx`

- [ ] **Step 1: 写动画工具函数**

```ts
// remotion-player/src/animations.ts
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'

export function useFadeIn(delayFrames = 0, durationFrames = 20) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 15 },
    durationInFrames: durationFrames,
  })
}

export function useSlideInLeft(delayFrames = 0) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 15 },
    durationInFrames: 20,
  })
  return { opacity: progress, translateX: (1 - progress) * -50 }
}
```

- [ ] **Step 2: 写底部字幕条组件**

```tsx
// remotion-player/src/components/Caption.tsx
import React from 'react'
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'

interface CaptionProps {
  text: string
}

export const Caption: React.FC<CaptionProps> = ({ text }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const translateY = (1 - spring({ frame, fps, config: { damping: 15 }, durationInFrames: 20 })) * 50

  return (
    <div style={{
      position: 'absolute',
      bottom: 40,
      left: '50%',
      transform: `translateX(-50%) translateY(${translateY}px)`,
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '8px 24px',
      borderRadius: 4,
      fontSize: 28,
      maxWidth: '80%',
      textAlign: 'center',
      fontFamily: '"Noto Sans SC", sans-serif',
    }}>
      {text}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add remotion-player/src/animations.ts remotion-player/src/components/Caption.tsx
git commit -m "feat: add animation utilities and Caption component"
```

---

### Task 11: TitleSlide + ContentSlide 组件

**Files:**
- Create: `remotion-player/src/compositions/ArticleVideo/components/TitleSlide.tsx`
- Create: `remotion-player/src/compositions/ArticleVideo/components/ContentSlide.tsx`

- [ ] **Step 1: 实现 TitleSlide**

```tsx
// remotion-player/src/compositions/ArticleVideo/components/TitleSlide.tsx
import React from 'react'
import { useFadeIn } from '../../../animations.js'
import type { TitleSlide as TitleSlideType } from '../../../types.js'

export const TitleSlide: React.FC<{ slide: TitleSlideType }> = ({ slide }) => {
  const opacity = useFadeIn(0, 30)
  const scale = 1.05 - 0.05 * opacity

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#ffffff',
      fontFamily: '"Noto Sans SC", sans-serif',
    }}>
      <h1 style={{
        fontSize: 96, fontWeight: 700, color: '#1a1a2e',
        opacity, transform: `scale(${scale})`,
        margin: 0, textAlign: 'center',
      }}>
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p style={{
          fontSize: 48, color: '#6b7280', marginTop: 32,
          opacity: useFadeIn(20, 20),
        }}>
          {slide.subtitle}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 实现 ContentSlide**

```tsx
// remotion-player/src/compositions/ArticleVideo/components/ContentSlide.tsx
import React from 'react'
import { useFadeIn, useSlideInLeft } from '../../../animations.js'
import type { ContentSlide as ContentSlideType } from '../../../types.js'

// 独立组件，确保 Hooks 不在循环中调用
const ContentPoint: React.FC<{ point: string; index: number }> = ({ point, index }) => {
  const { opacity, translateX } = useSlideInLeft(index * 15)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 24,
      opacity, transform: `translateX(${translateX}px)`,
    }}>
      <span style={{ color: '#007bff', fontSize: 40, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: 40, color: '#1f2937' }}>{point}</span>
    </div>
  )
}

export const ContentSlide: React.FC<{ slide: ContentSlideType }> = ({ slide }) => {
  const titleOpacity = useFadeIn(0, 30)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      padding: '80px 120px',
      background: '#ffffff',
      fontFamily: '"Noto Sans SC", sans-serif',
    }}>
      <h2 style={{
        fontSize: 72, fontWeight: 700, color: '#1e40af',
        opacity: titleOpacity, marginBottom: 60,
      }}>
        {slide.title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {slide.points.map((point, i) => (
          <ContentPoint key={i} point={point} index={i} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add remotion-player/src/compositions/ArticleVideo/components/TitleSlide.tsx
git add remotion-player/src/compositions/ArticleVideo/components/ContentSlide.tsx
git commit -m "feat: add TitleSlide and ContentSlide Remotion components"
```

---

### Task 12: CardsSlide + HighlightSlide 组件

**Files:**
- Create: `remotion-player/src/compositions/ArticleVideo/components/CardsSlide.tsx`
- Create: `remotion-player/src/compositions/ArticleVideo/components/HighlightSlide.tsx`

- [ ] **Step 1: 实现 CardsSlide**

```tsx
// remotion-player/src/compositions/ArticleVideo/components/CardsSlide.tsx
import React from 'react'
import { useFadeIn } from '../../../animations.js'
import type { Card, CardsSlide as CardsSlideType } from '../../../types.js'

const CARD_COLORS = [
  { bg: 'rgba(240,248,255,0.8)', border: 'rgba(100,150,200,0.4)' },
  { bg: 'rgba(245,240,255,0.8)', border: 'rgba(150,100,200,0.4)' },
  { bg: 'rgba(240,255,240,0.8)', border: 'rgba(100,200,100,0.4)' },
  { bg: 'rgba(255,245,230,0.8)', border: 'rgba(200,150,100,0.4)' },
  { bg: 'rgba(230,255,240,0.8)', border: 'rgba(100,200,150,0.4)' },
]

// 独立组件，避免 Hooks 在 map 循环中调用
const CardItem: React.FC<{ card: Card; index: number }> = ({ card, index }) => {
  const opacity = useFadeIn(index * 12, 20)
  const color = CARD_COLORS[index % CARD_COLORS.length]
  return (
    <div style={{
      width: 300, padding: 28, borderRadius: 8,
      border: `1px solid ${color.border}`, background: color.bg,
      opacity, display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <span style={{ fontSize: 48 }}>{card.icon}</span>
      <div>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#1f2937' }}>{card.label}</div>
        <div style={{ fontSize: 22, color: '#6b7280', marginTop: 8 }}>{card.desc}</div>
      </div>
    </div>
  )
}

export const CardsSlide: React.FC<{ slide: CardsSlideType }> = ({ slide }) => {
  const titleOpacity = useFadeIn(0, 30)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px',
      background: '#ffffff',
      fontFamily: '"Noto Sans SC", sans-serif',
    }}>
      <h2 style={{
        fontSize: 72, fontWeight: 700, color: '#1e40af',
        opacity: titleOpacity, marginBottom: 60,
      }}>
        {slide.title}
      </h2>
      <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
        {slide.cards.map((card, i) => (
          <CardItem key={i} card={card} index={i} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 实现 HighlightSlide**

```tsx
// remotion-player/src/compositions/ArticleVideo/components/HighlightSlide.tsx
import React from 'react'
import { useFadeIn } from '../../../animations.js'
import type { HighlightSlide as HighlightSlideType } from '../../../types.js'

export const HighlightSlide: React.FC<{ slide: HighlightSlideType }> = ({ slide }) => {
  const titleOpacity = useFadeIn(0, 20)
  const quoteOpacity = useFadeIn(15, 30)
  const bodyOpacity = useFadeIn(35, 20)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 160px',
      background: '#ffffff',
      fontFamily: '"Noto Sans SC", sans-serif',
      textAlign: 'center',
    }}>
      <h3 style={{ fontSize: 52, color: '#f97316', opacity: titleOpacity, marginBottom: 48 }}>
        {slide.title}
      </h3>
      <blockquote style={{
        fontSize: 64, fontWeight: 700, color: '#1a1a2e',
        opacity: quoteOpacity, margin: 0, lineHeight: 1.4,
        borderLeft: '6px solid #f97316', paddingLeft: 40, textAlign: 'left',
      }}>
        {slide.quote}
      </blockquote>
      {slide.body && (
        <p style={{ fontSize: 40, color: '#6b7280', marginTop: 48, opacity: bodyOpacity }}>
          {slide.body}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add remotion-player/src/compositions/ArticleVideo/components/CardsSlide.tsx
git add remotion-player/src/compositions/ArticleVideo/components/HighlightSlide.tsx
git commit -m "feat: add CardsSlide and HighlightSlide Remotion components"
```

---

## Chunk 5: Remotion 合成 + 端到端集成

### Task 13: SlideRenderer + 主 Composition

**Files:**
- Create: `remotion-player/src/compositions/ArticleVideo/SlideRenderer.tsx`
- Create: `remotion-player/src/compositions/ArticleVideo/index.tsx`
- Modify: `remotion-player/src/Root.tsx`

- [ ] **Step 1: 实现 SlideRenderer**

```tsx
// remotion-player/src/compositions/ArticleVideo/SlideRenderer.tsx
import React from 'react'
import type { Slide } from '../../types.js'
import { TitleSlide } from './components/TitleSlide.js'
import { ContentSlide } from './components/ContentSlide.js'
import { CardsSlide } from './components/CardsSlide.js'
import { HighlightSlide } from './components/HighlightSlide.js'

export const SlideRenderer: React.FC<{ slide: Slide }> = ({ slide }) => {
  switch (slide.type) {
    case 'title':      return <TitleSlide slide={slide} />
    case 'content':    return <ContentSlide slide={slide} />
    case 'cards':      return <CardsSlide slide={slide} />
    case 'highlight':  return <HighlightSlide slide={slide} />
    default:           return <div>未知 slide 类型</div>
  }
}
```

- [ ] **Step 2: 实现主 ArticleVideo Composition**

```tsx
// remotion-player/src/compositions/ArticleVideo/index.tsx
import React from 'react'
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { SlidesJson } from '../../types.js'
import { SlideRenderer } from './SlideRenderer.js'
import { Caption } from '../../components/Caption.js'

interface Props {
  slidesData: SlidesJson
  captionText?: string
}

export const ArticleVideo: React.FC<Props> = ({ slidesData }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentSec = frame / fps

  // 找当前秒数对应的 slide
  const currentSlide = slidesData.slides.find(
    s => s.startSec !== undefined && s.endSec !== undefined
      && currentSec >= s.startSec && currentSec < s.endSec
  ) ?? slidesData.slides[0]

  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Audio src={staticFile('audio.mp3')} />
      <SlideRenderer slide={currentSlide} />
    </AbsoluteFill>
  )
}
```

- [ ] **Step 3: 更新 Root.tsx 读取真实数据**

```tsx
// remotion-player/src/Root.tsx
import React from 'react'
import { Composition } from 'remotion'
import { ArticleVideo } from './compositions/ArticleVideo/index.js'
import type { SlidesJson } from './types.js'

// 开发预览用的占位数据
const DEV_SLIDES: SlidesJson = {
  title: '开发预览',
  slides: [
    { id: 'intro', type: 'title', title: 'Article to Podcast', subtitle: '开发预览模式', startSec: 0, endSec: 5 },
    { id: 'content', type: 'content', title: '功能列表', points: ['口播脚本生成', '幻灯片自动布局', '语音合成'], startSec: 5, endSec: 15 },
  ]
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ArticleVideo"
        component={ArticleVideo}
        durationInFrames={450}   // 15s 开发预览，渲染时由 render.ts 传入实际时长
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ slidesData: DEV_SLIDES }}
        calculateMetadata={async ({ props }) => {
          // 根据 slides 最后一个 endSec 计算实际视频时长
          const lastSlide = props.slidesData.slides.at(-1)
          const totalSec = lastSlide?.endSec ?? 15
          return { durationInFrames: Math.ceil(totalSec * 30) }
        }}
      />
    </>
  )
}
```

- [ ] **Step 4: 验证 Remotion Studio 能启动**

```bash
cd remotion-player && npx remotion studio
# 浏览器打开 http://localhost:3000，能看到开发预览幻灯片
```

- [ ] **Step 5: Commit**

```bash
git add remotion-player/src/
git commit -m "feat: add SlideRenderer, ArticleVideo composition, and Root with dev preview"
```

---

### Task 14: 端到端集成测试

**Files:**
- Create: `pipeline/src/__tests__/e2e.test.ts`（集成验证脚本）

- [ ] **Step 1: 安装 edge-tts CLI**

```bash
pip install edge-tts
# 验证安装
edge-tts --list-voices | grep zh-CN
```

- [ ] **Step 2: 创建 .env 文件**

```bash
cd pipeline
cp .env.example .env
# 编辑 .env，填入真实的 ANTHROPIC_API_KEY
```

- [ ] **Step 3: 运行全流程（sample.md → 播客 + 视频）**

```bash
cd pipeline
npm run generate -- --input=../sample.md
```

预期输出：
```
📝 Step 1: 生成口播脚本...
✅ 脚本已保存：.../output/script.md
🎨 Step 2: 生成幻灯片结构...
✅ 幻灯片 JSON 已保存：.../output/slides.json
🔊 Step 3: 合成语音并写入时间戳...
✅ 播客已保存：.../output/audio.mp3
🎬 Step 4: 渲染视频...
✅ 视频已生成：.../output/video.mp4
🎉 完成！
```

- [ ] **Step 4: 验证产物**

```bash
# 检查文件存在
ls -lh ../output/
# 验证 slides.json 包含时间戳
cat ../output/slides.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['slides'][0])"
# 播放播客
open ../output/audio.mp3
# 播放视频
open ../output/video.mp4
```

- [ ] **Step 5: 测试 --from 参数**

```bash
# 编辑 output/script.md，手动修改一段文字
# 然后从 Step 2 重跑
npm run generate -- --input=../sample.md --from=2
# 确认 script.md 未被重新生成（修改保留），slides.json 和 audio.mp3 重新生成
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: complete end-to-end pipeline integration"
```

---

## 完成后验证清单

- [ ] `cd pipeline && npm test` 所有单元测试通过
- [ ] `npm run generate -- --input=../sample.md` 全流程跑通
- [ ] `output/audio.mp3` 可播放，内容为口语化中文旁白
- [ ] `output/video.mp4` 可播放，幻灯片与语音同步
- [ ] `--from=2` 重跑时 script.md 保持不变
- [ ] `npx remotion studio` 在浏览器中显示开发预览
