import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { resolveSpeaker } from './tts/speakers.js'

export interface TTSOverride {
  speaker?: string
  speed?: number
  pitch?: number
  emotion?: string
}

export interface TTSConfig {
  provider: 'doubao' | 'edge-tts' | 'fish-audio'
  speaker: string
  speed: number
  overrides: Record<string, TTSOverride>
}

export interface DurationConfig {
  targetSeconds: number
  charsPerSecond: number
}

/** 输出目录的详细配置，支持命名策略和冲突处理策略 */
export interface OutputConfig {
  baseDir: string
  naming: 'filename' | 'timestamp' | 'custom'
  onConflict: 'suffix' | 'overwrite' | 'fail'
  createLatestLink: boolean
}

export interface ProjectConfig {
  tts: TTSConfig
  duration: DurationConfig
  theme: string
  /** 可以是简单字符串（如 "output"）或详细的 OutputConfig 对象 */
  output: string | OutputConfig
}

const projectRoot = new URL('../..', import.meta.url).pathname

/**
 * 根据配置和可选的输出名称解析最终输出目录路径。
 *
 * 规则：
 * - 传了 outputName：用 config.output 的 baseDir（string 直接用，object 取 .baseDir）拼接 outputName
 * - 没传 outputName 且 config.output 是 string：直接 join(projectRoot, config.output)（向后兼容）
 * - 没传 outputName 且 config.output 是 object：join(projectRoot, config.output.baseDir)
 */
export function resolveOutputDir(config: ProjectConfig, outputName?: string): string {
  const baseDir = typeof config.output === 'string' ? config.output : config.output.baseDir

  if (outputName) {
    // 有指定输出名称时，在 baseDir 下创建对应子目录
    return join(projectRoot, baseDir, outputName)
  }

  // 没有指定输出名称时，直接返回 baseDir（向后兼容）
  return join(projectRoot, baseDir)
}

const defaults: ProjectConfig = {
  tts: {
    provider: 'doubao',
    speaker: 'Vivi',
    speed: 1.0,
    overrides: {},
  },
  duration: {
    targetSeconds: 60,
    charsPerSecond: 4,
  },
  theme: 'terminal-noir',
  output: 'output',
}

export function loadConfig(): ProjectConfig {
  const configPath = join(projectRoot, 'article.config.json')

  if (!existsSync(configPath)) {
    return { ...defaults }
  }

  const raw = JSON.parse(readFileSync(configPath, 'utf8'))
  const config: ProjectConfig = {
    tts: { ...defaults.tts, ...raw.tts, overrides: raw.tts?.overrides ?? {} },
    duration: { ...defaults.duration, ...raw.duration },
    theme: raw.theme ?? defaults.theme,
    // raw.output 可以是 string 或 OutputConfig object，均直接保留；未配置时回退到默认值
    output: raw.output ?? defaults.output,
  }

  validateConfig(config)
  return config
}

function validateConfig(config: ProjectConfig): void {
  if (config.tts.provider === 'doubao' && !process.env.DOUBAO_TTS_API_KEY) {
    throw new Error('DOUBAO_TTS_API_KEY 环境变量未设置')
  }
  // 校验音色名是否有效
  resolveSpeaker(config.tts.speaker)
  for (const [slideId, override] of Object.entries(config.tts.overrides)) {
    if (override.speaker) resolveSpeaker(override.speaker)
  }
}
