import { existsSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'
import { loadConfig, resolveOutputDir } from './config.js'
import { parseScript } from './parser.js'
import { synthesizeAndTimestamp } from './synthesize.js'
import { createTTSProvider } from './tts/factory.js'
import { estimateDuration, validateDuration } from './duration.js'
import type { SlidesJson } from './types.js'
import type { TTSOptions } from './tts/interface.js'

// ─── 参数解析 ─────────────────────────────────────────────────

const args = process.argv.slice(2)
const fromStep = parseInt(args.find(a => a.startsWith('--from='))?.split('=')[1] ?? '3', 10)
const outputNameArg = args.find(a => a.startsWith('--output-name='))?.split('=')[1]
const forceRerun = args.includes('--force')

// ─── 环境检查 ─────────────────────────────────────────────────

function checkDependencies(): void {
  try {
    execSync('which ffmpeg', { stdio: 'pipe' })
  } catch {
    console.error('❌ ffmpeg 未安装。请运行: brew install ffmpeg')
    process.exit(1)
  }

  const config = loadConfig()
  if (config.tts.provider === 'doubao' && !process.env.DOUBAO_TTS_API_KEY) {
    console.error('❌ DOUBAO_TTS_API_KEY 环境变量未设置')
    console.error('   获取方式: https://console.volcengine.com/speech/new/setting/apikeys')
    process.exit(1)
  }
}

// ─── 流程状态 ─────────────────────────────────────────────────

interface PipelineState {
  completedSteps: number[]
  synthesizedSegments: string[]
}

function loadState(outputDir: string): PipelineState {
  const statePath = join(outputDir, '.pipeline-state.json')
  if (!forceRerun && existsSync(statePath)) {
    return JSON.parse(readFileSync(statePath, 'utf8'))
  }
  return { completedSteps: [], synthesizedSegments: [] }
}

function saveState(outputDir: string, state: PipelineState): void {
  const statePath = join(outputDir, '.pipeline-state.json')
  writeFileSync(statePath, JSON.stringify(state, null, 2))
}

// ─── Step 3: TTS ─────────────────────────────────────────────

async function runTTS(
  outputDir: string,
  state: PipelineState,
): Promise<void> {
  const config = loadConfig()
  const scriptPath = join(outputDir, 'script.md')
  const slidesPath = join(outputDir, 'slides.json')

  if (!existsSync(scriptPath)) {
    console.error('❌ output/script.md 不存在，请先运行 Step 1 & 2')
    process.exit(1)
  }
  if (!existsSync(slidesPath)) {
    console.error('❌ output/slides.json 不存在，请先运行 Step 2')
    process.exit(1)
  }

  console.log('\n🔊 Step 3: 合成语音并写入时间戳...')
  console.log(`  音色: ${config.tts.speaker} | 目标时长: ${config.duration.targetSeconds}s`)

  // 时长预估
  const script = readFileSync(scriptPath, 'utf8')
  const { segments } = parseScript(script)
  const estimatedTotal = segments.reduce(
    (acc, seg) => acc + estimateDuration(seg.text, config.duration.charsPerSecond), 0
  )
  console.log(`  预估时长: ${estimatedTotal.toFixed(1)}s (基于 ${config.duration.charsPerSecond} 字/秒)`)

  const slides: SlidesJson = JSON.parse(readFileSync(slidesPath, 'utf8'))
  const tts = createTTSProvider(config.tts)

  const ttsOverrides: Record<string, TTSOptions> = {}
  for (const [slideId, override] of Object.entries(config.tts.overrides)) {
    ttsOverrides[slideId] = override
  }

  const updatedSlides = await synthesizeAndTimestamp(
    segments, slides, tts, outputDir, ttsOverrides, state.synthesizedSegments
  )
  writeFileSync(slidesPath, JSON.stringify(updatedSlides, null, 2))

  const totalDuration = updatedSlides.slides.reduce(
    (acc, s) => acc + ((s.endSec ?? 0) - (s.startSec ?? 0)), 0
  )

  const validation = validateDuration(config.duration.targetSeconds, totalDuration)
  console.log(`✅ 播客已保存：${join(outputDir, 'audio.mp3')}`)
  console.log(`✅ 时间戳已写入：${slidesPath}`)
  console.log(`📊 实际时长: ${totalDuration.toFixed(1)}s (目标: ${config.duration.targetSeconds}s)`)
  if (!validation.ok) {
    const direction = validation.diff > 0 ? '超出' : '不足'
    console.log(`⚠️  时长偏差 ${direction} ${Math.abs(validation.diff).toFixed(1)}s (${(validation.ratio * 100).toFixed(0)}%)`)
  }

  state.completedSteps.push(3)
  state.synthesizedSegments = segments.map(s => s.id)
  saveState(outputDir, state)
}

// ─── Step 4: 渲染 ─────────────────────────────────────────────

async function runRender(
  outputDir: string,
  state: PipelineState,
): Promise<void> {
  const { copyFileSync } = await import('fs')
  const config = loadConfig()
  const projectRoot = new URL('../..', import.meta.url).pathname
  const remotionDir = join(projectRoot, 'remotion-player')

  const audioSrc = join(outputDir, 'audio.mp3')
  const slidesSrc = join(outputDir, 'slides.json')
  const audioDst = join(remotionDir, 'public', 'audio.mp3')
  const videoOut = join(outputDir, 'video.mp4')

  if (!existsSync(audioSrc)) {
    console.error('❌ audio.mp3 不存在，请先运行 Step 3')
    process.exit(1)
  }
  if (!existsSync(slidesSrc)) {
    console.error('❌ slides.json 不存在，请先运行 Step 2')
    process.exit(1)
  }

  const slides = JSON.parse(readFileSync(slidesSrc, 'utf8'))
  const hasTimestamps = slides.slides.every((s: any) => s.startSec !== undefined)
  if (!hasTimestamps) {
    console.error('❌ slides.json 缺少时间戳，请先运行 Step 3')
    process.exit(1)
  }

  copyFileSync(audioSrc, audioDst)
  console.log('  ✓ 音频已复制到 remotion-player/public/')

  const slidesData = JSON.parse(readFileSync(slidesSrc, 'utf8'))
  const propsFile = join(outputDir, '.remotion-props.json')
  writeFileSync(propsFile, JSON.stringify({
    slidesData,
    themePreset: config.theme,
  }))

  console.log('\n🎬 Step 4: 渲染视频...')
  execSync(
    `npx remotion render src/index.ts ArticleVideo "${videoOut}" --props="${propsFile}"`,
    { cwd: remotionDir, stdio: 'inherit' }
  )

  console.log(`✅ 视频已生成：${videoOut}`)
  state.completedSteps.push(4)
  saveState(outputDir, state)
}

// ─── 主流程 ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀 article-to-podcast pipeline')
  console.log(`   --from=${fromStep}${forceRerun ? ' --force' : ''}`)

  checkDependencies()

  const config = loadConfig()
  const outputDir = resolveOutputDir(config, outputNameArg)
  const state = loadState(outputDir)

  if (fromStep <= 3 && !state.completedSteps.includes(3)) {
    await runTTS(outputDir, state)
  } else if (fromStep <= 3) {
    console.log('⏭️  Step 3 已完成，跳过（使用 --force 重新运行）')
  }

  if (fromStep <= 4 && !state.completedSteps.includes(4)) {
    await runRender(outputDir, state)
  } else if (fromStep <= 4) {
    console.log('⏭️  Step 4 已完成，跳过（使用 --force 重新运行）')
  }

  console.log('\n🎉 流程完成！')
}

main().catch((err: Error) => {
  console.error(`\n❌ 流程失败: ${err.message}`)
  console.error(`   建议: 从失败步骤重试 npx tsx src/run.ts --from=N`)
  process.exit(1)
})
