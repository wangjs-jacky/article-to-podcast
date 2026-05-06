import { execSync } from 'child_process'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { loadConfig, resolveOutputDir } from './config.js'
const config = loadConfig()

// import.meta.url 指向 pipeline/src/render.ts，../.. 向上两级到项目根目录
const projectRoot = new URL('../..', import.meta.url).pathname

// 从命令行参数中解析 --output-name=<name>，不传时保持向后兼容（产物在 output/ 下）
const outputNameArg = process.argv.find((a: string) => a.startsWith('--output-name='))?.split('=')[1]
const outputDir = resolveOutputDir(config, outputNameArg)
const remotionDir = join(projectRoot, 'remotion-player')

const audioSrc = join(outputDir, 'audio.mp3')
const slidesSrc = join(outputDir, 'slides.json')
const audioDst = join(remotionDir, 'public', 'audio.mp3')
const videoOut = join(outputDir, 'video.mp4')

if (!existsSync(audioSrc)) throw new Error(`audio.mp3 不存在，请先运行 Step 3`)
if (!existsSync(slidesSrc)) throw new Error(`slides.json 不存在，请先运行 Step 2`)

const slides = JSON.parse(readFileSync(slidesSrc, 'utf8'))
const hasTimestamps = slides.slides.every((s: any) => s.startSec !== undefined)
if (!hasTimestamps) throw new Error(`slides.json 缺少时间戳，请先运行 Step 3`)

copyFileSync(audioSrc, audioDst)
console.log('  ✓ 音频已复制到 remotion-player/public/')

// Remotion --props 需要包裹成 { slidesData: ... } 的结构，且通过文件路径传入避免 shell 转义问题
const slidesData = JSON.parse(readFileSync(slidesSrc, 'utf8'))
const propsFile = join(outputDir, '.remotion-props.json')
writeFileSync(propsFile, JSON.stringify({
  slidesData,
  themePreset: config.theme,
}))

console.log('🎬 Step 4: 渲染视频...')
execSync(
  `npx remotion render src/index.ts ArticleVideo "${videoOut}" --props="${propsFile}"`,
  { cwd: remotionDir, stdio: 'inherit' }
)

console.log(`✅ 视频已生成：${videoOut}`)
