import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { parseScript } from './parser.js'
import { synthesizeAndTimestamp } from './synthesize.js'
import { createTTSProvider } from './tts/factory.js'
import { loadConfig, resolveOutputDir } from './config.js'
import type { SlidesJson } from './types.js'
import type { TTSOptions } from './tts/interface.js'

const config = loadConfig()

// 从命令行参数中解析 --output-name=<name>，不传时保持向后兼容（产物在 output/ 下）
const outputNameArg = process.argv.find((a: string) => a.startsWith('--output-name='))?.split('=')[1]
const outputDir = resolveOutputDir(config, outputNameArg)
const scriptPath = join(outputDir, 'script.md')
const slidesPath = join(outputDir, 'slides.json')

console.log('🔊 Step 3: 合成语音并写入时间戳...')
console.log(`  音色: ${config.tts.speaker} | 目标时长: ${config.duration.targetSeconds}s`)

const script = readFileSync(scriptPath, 'utf8')
const slides: SlidesJson = JSON.parse(readFileSync(slidesPath, 'utf8'))
const { segments } = parseScript(script)

const tts = createTTSProvider(config.tts)

// 将配置中的 per-slide overrides 转为 TTSOptions
const ttsOverrides: Record<string, TTSOptions> = {}
for (const [slideId, override] of Object.entries(config.tts.overrides)) {
  ttsOverrides[slideId] = override
}

// 检测已合成的段落用于断点续跑
const cachedIds = segments
  .filter(seg => existsSync(join(outputDir, `.tmp_seg_${seg.id}.mp3`)))
  .map(seg => seg.id)

const updatedSlides = await synthesizeAndTimestamp(segments, slides, tts, outputDir, ttsOverrides, cachedIds)
writeFileSync(slidesPath, JSON.stringify(updatedSlides, null, 2))

const totalDuration = updatedSlides.slides.reduce(
  (acc, s) => acc + ((s.endSec ?? 0) - (s.startSec ?? 0)), 0
)
console.log(`✅ 播客已保存：${join(outputDir, 'audio.mp3')}`)
console.log(`✅ 时间戳已写入：${slidesPath}`)
console.log(`📊 实际时长: ${totalDuration.toFixed(1)}s (目标: ${config.duration.targetSeconds}s)`)
