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

    const result = execSync(
      `ffprobe -v quiet -print_format json -show_format "${outputPath}"`,
      { encoding: 'utf8' }
    )
    const { format } = JSON.parse(result)
    return parseFloat(format.duration)
  }
}
