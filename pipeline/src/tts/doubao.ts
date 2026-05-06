import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import type { TTSProvider } from './interface.js'

const SSE_URL = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse'

export class DoubaoTTSProvider implements TTSProvider {
  private apiKey: string
  private resourceId: string
  private speaker: string

  constructor(opts?: { apiKey?: string; resourceId?: string; speaker?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.DOUBAO_TTS_API_KEY ?? ''
    this.resourceId = opts?.resourceId ?? 'seed-tts-2.0'
    this.speaker = opts?.speaker ?? process.env.DOUBAO_TTS_SPEAKER ?? 'zh_female_vv_uranus_bigtts'

    if (!this.apiKey) {
      throw new Error('DOUBAO_TTS_API_KEY 环境变量未设置，请在火山引擎控制台获取 API Key')
    }
  }

  async synthesize(text: string, outputPath: string): Promise<number> {
    const resp = await fetch(SSE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
        'X-Api-Resource-Id': this.resourceId,
      },
      body: JSON.stringify({
        user: { uid: 'article-to-podcast' },
        req_params: {
          text,
          speaker: this.speaker,
          audio_params: { format: 'mp3', sample_rate: 24000 },
        },
        operation: 'query',
      }),
    })

    if (!resp.ok) {
      throw new Error(`豆包 TTS API 错误 (${resp.status}): ${await resp.text()}`)
    }

    const chunks: Buffer[] = []
    const body = resp.body!
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.code === 0 && payload.data) {
              chunks.push(Buffer.from(payload.data, 'base64'))
            } else if (payload.code && payload.code !== 20000000) {
              throw new Error(`豆包 TTS 合成失败 (${payload.code}): ${payload.message}`)
            }
          } catch {
            // 跳过非 JSON 行
          }
        }
      }
    }

    if (chunks.length === 0) {
      throw new Error('豆包 TTS 未返回音频数据')
    }

    writeFileSync(outputPath, Buffer.concat(chunks))
    if (!existsSync(outputPath)) {
      throw new Error(`TTS 输出文件未生成：${outputPath}`)
    }

    const result = execSync(
      `ffprobe -v quiet -print_format json -show_format "${outputPath}"`,
      { encoding: 'utf8' }
    )
    return parseFloat(JSON.parse(result).format.duration)
  }
}
