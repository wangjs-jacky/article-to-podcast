import { describe, it, expect } from 'vitest'
import { EdgeTTSProvider } from '../tts/edge-tts.js'
import { existsSync, unlinkSync } from 'fs'

describe.skip('EdgeTTSProvider（需要 edge-tts CLI）', () => {
  it('合成短文字并返回时长', async () => {
    const tts = new EdgeTTSProvider()
    const outPath = '/tmp/tts-test.mp3'
    const duration = await tts.synthesize('你好世界', outPath)
    expect(existsSync(outPath)).toBe(true)
    expect(duration).toBeGreaterThan(0)
    unlinkSync(outPath)
  }, 30000)
})
