# Article to Podcast Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 输入 Markdown 文章，自动产出口播风格播客（MP3）和幻灯片讲解视频（MP4），每步生成可编辑中间产物。

**Architecture:** Claude Code skill 直接处理 LLM 步骤（Step 1 & 2）——读取文章后直接写入 `output/script.md` 和 `output/slides.json`，无需 API Key 包装层；TypeScript 脚本只处理 Step 3（TTS 合成）和 Step 4（Remotion 渲染），由 skill 通过 Bash 调用。`--from=N` 逻辑由 skill 判断中间产物是否存在来实现。

**Tech Stack:** Node.js + TypeScript + tsx，edge-tts（Python CLI，TTS 占位），ffmpeg（音频拼接，系统依赖），Remotion（视频渲染），vitest（测试）

---

## Chunk 1: 项目脚手架 + 共享类型 + 脚本解析器

### Task 1: 初始化 pipeline/ 项目

**Files:**
- Create: `pipeline/package.json`
- Create: `pipeline/tsconfig.json`
- Create: `pipeline/src/types.ts`

- [ ] **Step 1: 创建 pipeline/ 目录并安装依赖**

```bash
mkdir -p pipeline/src/tts pipeline/src/__tests__
cd pipeline
npm init -y
npm install gray-matter
npm install -D typescript tsx vitest @types/node
```

> 无需安装 anthropic SDK、dotenv、cac——LLM 步骤由 skill 直接执行，无需 API Key。

- [ ] **Step 2: 写 tsconfig.json**

```json
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
    "tts": "tsx src/tts.ts",
    "render": "tsx src/render.ts",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: 写共享类型 `pipeline/src/types.ts`**

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

- [ ] **Step 5: Commit**

```bash
git add pipeline/
git commit -m "feat: initialize pipeline project with shared types"
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
```

- [ ] **Step 7: Commit**

```bash
git add remotion-player/ .gitignore
git commit -m "feat: initialize remotion-player project"
```

---

### Task 3: 脚本解析器

解析 `script.md` 的核心工具，被 `tts.ts` 和 skill 的 ID 验证步骤共用。

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

describe('parseScript ID 校验', () => {
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
  // split 结果：[前置内容, id1, text1, id2, text2, ...]，第一项为标记前内容（丢弃）
  const segments: ScriptSegment[] = []
  for (let i = 1; i < parts.length; i += 2) {
    segments.push({ id: parts[i].trim(), text: (parts[i + 1] ?? '').trim() })
  }

  // 校验 ID 一致性
  const parsedIds = segments.map(s => s.id)
  const expectedIds = frontmatter.slide_markers
  const mismatch =
    parsedIds.length !== expectedIds.length ||
    parsedIds.some((id, i) => id !== expectedIds[i])

  if (mismatch) {
    throw new Error(
      `SLIDE ID 不匹配：script.md 中的 [${parsedIds}] 与 frontmatter 中的 [${expectedIds}] 不一致`
    )
  }

  return { frontmatter, segments }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd pipeline && npx vitest run src/__tests__/parser.test.ts
```
预期：PASS，3 个测试通过

- [ ] **Step 5: Commit**

```bash
git add pipeline/src/parser.ts pipeline/src/__tests__/parser.test.ts
git commit -m "feat: add script parser with SLIDE marker splitting and ID validation"
```

---

## Chunk 2: TTS 合成脚本 + Render 脚本

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

edge-tts 是 Python CLI 工具（`pip install edge-tts`），通过 execSync 调用。

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

- [ ] **Step 3: 写 TTS 集成测试（本地运行，CI 跳过）**

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

### Task 5: synthesize.ts — 分段合成 + 时间戳写回

**Files:**
- Create: `pipeline/src/synthesize.ts`
- Create: `pipeline/src/__tests__/synthesize.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// pipeline/src/__tests__/synthesize.test.ts
import { describe, it, expect, vi } from 'vitest'
import { synthesizeAndTimestamp } from '../synthesize.js'
import type { SlidesJson } from '../types.js'

const mockTTS = {
  synthesize: vi.fn()
    .mockResolvedValueOnce(3.2)  // intro: 3.2s
    .mockResolvedValueOnce(8.7)  // main: 8.7s
}

vi.mock('child_process', () => ({ execSync: vi.fn() }))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, writeFileSync: vi.fn(), mkdirSync: vi.fn() }
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
cd pipeline && npx vitest run src/__tests__/synthesize.test.ts
```

- [ ] **Step 3: 实现 synthesize.ts**

```ts
// pipeline/src/synthesize.ts
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

  for (const seg of segments) {
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
cd pipeline && npx vitest run src/__tests__/synthesize.test.ts
```
预期：PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/src/synthesize.ts pipeline/src/__tests__/synthesize.test.ts
git commit -m "feat: add synthesizeAndTimestamp with ffmpeg concat"
```

---

### Task 6: tts.ts — TTS 入口脚本

由 skill 通过 `npm run tts` 调用的独立可执行脚本，无需参数。

**Files:**
- Create: `pipeline/src/tts.ts`

- [ ] **Step 1: 实现 tts.ts**

```ts
// pipeline/src/tts.ts
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { parseScript } from './parser.js'
import { synthesizeAndTimestamp } from './synthesize.js'
import { EdgeTTSProvider } from './tts/edge-tts.js'
import type { SlidesJson } from './types.js'

// import.meta.url 指向 pipeline/src/tts.ts，../.. 向上两级到项目根目录
const projectRoot = new URL('../..', import.meta.url).pathname
const outputDir = join(projectRoot, 'output')
const scriptPath = join(outputDir, 'script.md')
const slidesPath = join(outputDir, 'slides.json')

console.log('🔊 Step 3: 合成语音并写入时间戳...')

const script = readFileSync(scriptPath, 'utf8')
const slides: SlidesJson = JSON.parse(readFileSync(slidesPath, 'utf8'))
const { segments } = parseScript(script)

const tts = new EdgeTTSProvider()
const updatedSlides = await synthesizeAndTimestamp(segments, slides, tts, outputDir)
writeFileSync(slidesPath, JSON.stringify(updatedSlides, null, 2))

console.log(`✅ 播客已保存：${join(outputDir, 'audio.mp3')}`)
console.log(`✅ 时间戳已写入：${slidesPath}`)
```

- [ ] **Step 2: 验证脚本能被 tsx 解析（无需实际执行 TTS）**

```bash
cd pipeline && tsx --version
# 只检查语法，不实际运行
```

- [ ] **Step 3: Commit**

```bash
git add pipeline/src/tts.ts
git commit -m "feat: add tts.ts entry script for skill invocation"
```

---

### Task 7: render.ts — Remotion 渲染脚本

由 skill 通过 `npm run render` 调用，读取 `output/` 下的产物触发 Remotion 渲染。

**Files:**
- Create: `pipeline/src/render.ts`

- [ ] **Step 1: 实现 render.ts**

```ts
// pipeline/src/render.ts
import { execSync } from 'child_process'
import { copyFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

// import.meta.url 指向 pipeline/src/render.ts
const projectRoot = new URL('../..', import.meta.url).pathname
const outputDir = join(projectRoot, 'output')
const remotionDir = join(projectRoot, 'remotion-player')

const audioSrc = join(outputDir, 'audio.mp3')
const slidesSrc = join(outputDir, 'slides.json')
const audioDst = join(remotionDir, 'public', 'audio.mp3')
const videoOut = join(outputDir, 'video.mp4')

if (!existsSync(audioSrc)) throw new Error(`audio.mp3 不存在，请先运行 Step 3`)
if (!existsSync(slidesSrc)) throw new Error(`slides.json 不存在，请先运行 Step 2`)

// 验证 slides.json 包含时间戳
const slides = JSON.parse(readFileSync(slidesSrc, 'utf8'))
const hasTimestamps = slides.slides.every((s: any) => s.startSec !== undefined)
if (!hasTimestamps) throw new Error(`slides.json 缺少时间戳，请先运行 Step 3`)

// 复制音频到 remotion public/
copyFileSync(audioSrc, audioDst)
console.log('  ✓ 音频已复制到 remotion-player/public/')

// --props 传入 JSON 字符串（不是文件路径）
const propsJson = readFileSync(slidesSrc, 'utf8')

console.log('🎬 Step 4: 渲染视频...')
execSync(
  `npx remotion render ArticleVideo "${videoOut}" --props=${JSON.stringify(propsJson)}`,
  { cwd: remotionDir, stdio: 'inherit' }
)

console.log(`✅ 视频已生成：${videoOut}`)
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/src/render.ts
git commit -m "feat: add render.ts entry script for Remotion rendering"
```

---

## Chunk 3: Remotion 幻灯片组件

### Task 8: 共享动画工具 + 字幕条

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

### Task 9: TitleSlide + ContentSlide 组件

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

每个列表项独立为组件，确保 Hooks 不在循环中调用。

```tsx
// remotion-player/src/compositions/ArticleVideo/components/ContentSlide.tsx
import React from 'react'
import { useFadeIn, useSlideInLeft } from '../../../animations.js'
import type { ContentSlide as ContentSlideType } from '../../../types.js'

// 独立组件，每个实例独立调用 Hook
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

### Task 10: CardsSlide + HighlightSlide 组件

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

// 独立组件，每个实例独立调用 Hook
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

## Chunk 4: Remotion 合成 + Skill 文件 + 端到端集成

### Task 11: SlideRenderer + 主 Composition + Root

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
    case 'title':     return <TitleSlide slide={slide} />
    case 'content':   return <ContentSlide slide={slide} />
    case 'cards':     return <CardsSlide slide={slide} />
    case 'highlight': return <HighlightSlide slide={slide} />
    default:          return <div>未知 slide 类型</div>
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

interface Props {
  slidesData: SlidesJson
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
      {/* staticFile() 从 remotion-player/public/ 目录读取 */}
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
        durationInFrames={450}   // 开发预览默认 15s，渲染时由 calculateMetadata 计算实际时长
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ slidesData: DEV_SLIDES }}
        calculateMetadata={async ({ props }) => {
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

### Task 12: article-to-podcast Skill 文件

Skill 文件由 Claude Code 执行，替代原来的 LLM 调用层（step1-script.ts、step2-slides.ts、index.ts）。

**Files:**
- Create: `skills/article-to-podcast/SKILL.md`

- [ ] **Step 1: 创建 skill 目录**

```bash
mkdir -p skills/article-to-podcast
```

- [ ] **Step 2: 写 SKILL.md**

```markdown
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

| N | 含义 |
|---|------|
| 1 | 文章 → 口播脚本（output/script.md）|
| 2 | 脚本 → 幻灯片 JSON（output/slides.json）|
| 3 | TTS 合成（output/audio.mp3）|
| 4 | Remotion 渲染（output/video.mp4）|

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
1. 解析 `<input-file>` 路径和 `--from` 值（默认 1）
2. 运行 `mkdir -p output` 确保输出目录存在

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
- 全文约 1400 字（约 7 分钟视频）
- 结构：开场（1个）→ 背景铺垫（1-2个）→ 核心内容（3-5个）→ 总结（1个）

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
```

- [ ] **Step 3: 将 skill 链接到全局**

```bash
cd /Users/jiashengwang/jacky-github/jacky-skills
# 将 article-to-podcast 从本项目链接过来
ln -s /Users/jiashengwang/jacky-github/article-to-podcast/skills/article-to-podcast article-to-podcast
j-skills link article-to-podcast
j-skills install article-to-podcast -g
```

- [ ] **Step 4: Commit**

```bash
git add skills/
git commit -m "feat: add article-to-podcast Claude Code skill"
```

---

### Task 13: 端到端集成测试

- [ ] **Step 1: 安装系统依赖**

```bash
# edge-tts（Python CLI）
pip install edge-tts
# 验证安装
edge-tts --list-voices | grep zh-CN

# ffmpeg（如未安装）
brew install ffmpeg
```

- [ ] **Step 2: 运行全流程（sample.md → 播客 + 视频）**

在 Claude Code 中调用 skill：

```
/article-to-podcast sample.md
```

预期日志：
```
📝 Step 1: 生成口播脚本...（Claude 直接写文件）
🎨 Step 2: 生成幻灯片 JSON...（Claude 直接写文件）
🔊 Step 3: 合成语音并写入时间戳...
✅ 播客已保存：.../output/audio.mp3
🎬 Step 4: 渲染视频...
✅ 视频已生成：.../output/video.mp4
```

- [ ] **Step 3: 验证产物**

```bash
# 检查文件存在
ls -lh output/

# 验证 slides.json 包含时间戳
python3 -c "import json; d=json.load(open('output/slides.json')); print(d['slides'][0])"

# 播放播客
open output/audio.mp3

# 播放视频
open output/video.mp4
```

- [ ] **Step 4: 测试 --from 参数**

```bash
# 手动编辑 output/script.md，修改某段文字
# 然后从 Step 2 重跑（跳过 Step 1）
# 在 Claude Code 中运行：
/article-to-podcast sample.md --from=2
# 确认 script.md 保留了手动编辑，slides.json 和 audio.mp3 重新生成
```

- [ ] **Step 5: 运行单元测试**

```bash
cd pipeline && npm test
# 预期：parser + synthesize 测试全部通过
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: complete end-to-end article-to-podcast pipeline"
```

---

## 完成后验证清单

- [ ] `cd pipeline && npm test` 所有单元测试通过
- [ ] `/article-to-podcast sample.md` 全流程跑通
- [ ] `output/audio.mp3` 可播放，内容为口语化中文旁白
- [ ] `output/video.mp4` 可播放，幻灯片与语音同步
- [ ] `/article-to-podcast sample.md --from=2` 重跑时 `output/script.md` 保持不变
- [ ] `npx remotion studio`（在 remotion-player/ 中）浏览器显示开发预览
