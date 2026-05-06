import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import type { TTSProvider } from './interface.js'

export class FishAudioProvider implements TTSProvider {
  private apiKey: string
  private referenceId: string
  private model: string

  constructor(opts?: { apiKey?: string; referenceId?: string; model?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.FISH_AUDIO_API_KEY ?? ''
    this.referenceId = opts?.referenceId ?? process.env.FISH_AUDIO_REFERENCE_ID ?? ''
    this.model = opts?.model ?? 's2-pro'

    if (!this.apiKey) {
      throw new Error('FISH_AUDIO_API_KEY 环境变量未设置，请在 https://fish.audio 获取 API Key')
    }
    if (!this.referenceId) {
      throw new Error('FISH_AUDIO_REFERENCE_ID 环境变量未设置，请在 https://fish.audio 选择音色并复制模型 ID')
    }
  }

  async synthesize(text: string, outputPath: string): Promise<number> {
    const resp = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        reference_id: this.referenceId,
        model: this.model,
      }),
    })

    if (!resp.ok) {
      const body = await resp.text()
      throw new Error(`Fish Audio API 错误 (${resp.status}): ${body}`)
    }

    const buffer = Buffer.from(await resp.arrayBuffer())
    writeFileSync(outputPath, buffer)

    if (!existsSync(outputPath)) {
      throw new Error(`TTS 输出文件未生成：${outputPath}`)
    }

    const result = execSync(
      `ffprobe -v quiet -print_format json -show_format "${outputPath}"`,
      { encoding: 'utf8' }
    )
    const { format } = JSON.parse(result)
    return parseFloat(format.duration)
  }
}
