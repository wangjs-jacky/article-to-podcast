import { createHash } from 'crypto'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { createInterface } from 'readline'
import { join } from 'path'
import { parseScript } from './parser.js'
import type { Slide, SlidesJson } from './types.js'

// import.meta.url 指向 pipeline/src/preview.ts，../.. 向上两级到项目根目录
const projectRoot = new URL('../..', import.meta.url).pathname
const outputDir = join(projectRoot, 'output')
const previewDir = join(outputDir, 'preview')
const remotionDir = join(projectRoot, 'remotion-player')

const slidesSrc = join(outputDir, 'slides.json')
const scriptSrc = join(outputDir, 'script.md')
const cacheFile = join(previewDir, '.cache.json')

// ---------- 前置检查 ----------
if (!existsSync(slidesSrc)) {
  throw new Error(`slides.json 不存在，请先运行 Step 2`)
}
if (!existsSync(scriptSrc)) {
  throw new Error(`script.md 不存在，请先运行 Step 1`)
}

// ---------- 读取数据 ----------
const slidesData: SlidesJson = JSON.parse(readFileSync(slidesSrc, 'utf8'))
const scriptContent = readFileSync(scriptSrc, 'utf8')
const { segments, frontmatter } = parseScript(scriptContent)

// 以 id 为 key 建立口播文本查找表
const scriptMap = new Map(segments.map(s => [s.id, s.text]))

// ---------- 准备输出目录 ----------
mkdirSync(previewDir, { recursive: true })

// ---------- 读取缓存 ----------
type CacheMap = Record<string, string>
let cache: CacheMap = {}
if (existsSync(cacheFile)) {
  try {
    cache = JSON.parse(readFileSync(cacheFile, 'utf8')) as CacheMap
  } catch {
    cache = {}
  }
}

// ---------- 计算 slide hash（去掉 startSec/endSec，内容变化才重渲） ----------
function slideHash(slide: Slide): string {
  const { startSec: _s, endSec: _e, ...rest } = slide as Slide & { startSec?: number; endSec?: number }
  return createHash('md5').update(JSON.stringify(rest)).digest('hex')
}

// ---------- 逐张渲染 ----------
console.log(`🖼  Step 2.5: 生成幻灯片预览（共 ${slidesData.slides.length} 张）...`)

const slides = slidesData.slides
for (let i = 0; i < slides.length; i++) {
  const slide = slides[i]
  const hash = slideHash(slide)
  const pngPath = join(previewDir, `slide-${slide.id}.png`)
  const propsJsonPath = join(previewDir, `.remotion-preview-props-${slide.id}.json`)

  // 检查缓存：png 文件存在且 hash 匹配时跳过
  if (existsSync(pngPath) && cache[slide.id] === hash) {
    console.log(`  ↩ 跳过（缓存命中）: [${i + 1}/${slides.length}] ${slide.id}`)
    continue
  }

  console.log(`  → 渲染: [${i + 1}/${slides.length}] ${slide.id} (${slide.type})`)

  // 将 props 写入临时文件，避免命令行 shell 转义问题（参考 render.ts 的做法）
  writeFileSync(propsJsonPath, JSON.stringify({ slide }))

  execSync(
    `npx remotion still src/index.ts PreviewSlide "${pngPath}" --frame=30 --props="${propsJsonPath}"`,
    { cwd: remotionDir, stdio: 'inherit' }
  )

  // 渲染成功后更新缓存
  cache[slide.id] = hash
}

// 持久化缓存
writeFileSync(cacheFile, JSON.stringify(cache, null, 2))
console.log('  ✓ 缓存已更新')

// ---------- 生成 HTML 预览页 ----------
const title = frontmatter.title ?? slidesData.title ?? '幻灯片预览'

const slidesHtml = slides
  .map((slide, index) => {
    const scriptText = scriptMap.get(slide.id) ?? '（无口播文本）'
    // img src 使用相对路径，浏览器打开 index.html 时自动加载同目录 PNG
    return `    <div class="slide-card">
      <div class="slide-img"><img src="slide-${slide.id}.png" alt="${slide.id}" /></div>
      <div class="slide-meta">
        <div class="slide-id">${index + 1}. ${slide.id} · ${slide.type}</div>
        <h3>口播文本</h3>
        <div class="script-text">${escapeHtml(scriptText)}</div>
      </div>
    </div>`
  })
  .join('\n')

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>Preview: ${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #0a0a0b; color: #e5e5e7; font-family: 'JetBrains Mono', monospace, sans-serif; margin: 0; padding: 32px; }
    header { margin-bottom: 32px; }
    h1 { color: #00ff88; font-size: 24px; margin: 0 0 8px; }
    .meta { color: #6b6b76; font-size: 13px; }
    .slides { display: flex; flex-direction: column; gap: 24px; }
    .slide-card { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; }
    .slide-img img { width: 100%; border-radius: 4px; display: block; }
    .slide-meta h3 { color: #00ff88; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 12px; }
    .slide-id { color: #ffb800; font-size: 12px; margin-bottom: 8px; }
    .script-text { color: #a0a0a8; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-all; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">共 ${slides.length} 张幻灯片 · Step 2.5 预览</p>
  </header>
  <div class="slides">
${slidesHtml}
  </div>
</body>
</html>`

const htmlPath = join(previewDir, 'index.html')
writeFileSync(htmlPath, html, 'utf8')
console.log(`  ✓ 预览页已生成：${htmlPath}`)

// ---------- 打开浏览器 ----------
execSync(`open "${htmlPath}"`)

// ---------- 等待用户确认 ----------
const rl = createInterface({ input: process.stdin, output: process.stdout })

function askConfirm(): void {
  rl.question('\n✅ 预览已生成，请在浏览器中确认。\n满意后输入 y 继续 Step 3，输入 n 退出：', (answer) => {
    const normalized = answer.trim().toLowerCase()
    if (normalized === 'y') {
      console.log('继续执行 Step 3...')
      rl.close()
      process.exit(0)
    } else if (normalized === 'n') {
      console.log('已退出，请修改 output/slides.json 或 output/script.md 后重新预览')
      rl.close()
      process.exit(1)
    } else {
      console.log('请输入 y 或 n')
      askConfirm()
    }
  })
}

askConfirm()
