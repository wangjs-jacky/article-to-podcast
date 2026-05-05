import { execSync } from 'child_process'
import { copyFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

// import.meta.url 指向 pipeline/src/render.ts，../.. 向上两级到项目根目录
const projectRoot = new URL('../..', import.meta.url).pathname
const outputDir = join(projectRoot, 'output')
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

const propsJson = readFileSync(slidesSrc, 'utf8')

console.log('🎬 Step 4: 渲染视频...')
execSync(
  `npx remotion render ArticleVideo "${videoOut}" --props=${JSON.stringify(propsJson)}`,
  { cwd: remotionDir, stdio: 'inherit' }
)

console.log(`✅ 视频已生成：${videoOut}`)
