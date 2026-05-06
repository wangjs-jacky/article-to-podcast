import type { TTSProvider } from './interface.js'
import { DoubaoTTSProvider } from './doubao.js'
import { resolveSpeaker } from './speakers.js'
import type { TTSConfig } from '../config.js'

export function createTTSProvider(config: TTSConfig): TTSProvider {
  const speaker = resolveSpeaker(config.speaker)

  switch (config.provider) {
    case 'doubao':
      return new DoubaoTTSProvider({
        speaker: speaker.name,
        speed: config.speed,
      })
    default:
      throw new Error(`不支持的 TTS provider: ${config.provider}`)
  }
}
