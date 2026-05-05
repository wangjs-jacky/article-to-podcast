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
