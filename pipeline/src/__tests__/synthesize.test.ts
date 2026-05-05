import { describe, it, expect, vi } from 'vitest'
import { synthesizeAndTimestamp } from '../synthesize.js'
import type { SlidesJson } from '../types.js'

const mockTTS = {
  synthesize: vi.fn()
    .mockResolvedValueOnce(3.2)  // intro: 3.2s
    .mockResolvedValueOnce(8.7)  // main: 8.7s
}

vi.mock('child_process', () => ({ execSync: vi.fn() }))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, writeFileSync: vi.fn(), mkdirSync: vi.fn() }
})

describe('synthesizeAndTimestamp', () => {
  it('为每个 slide 写入正确的 startSec/endSec', async () => {
    const slides: SlidesJson = {
      title: '测试',
      slides: [
        { id: 'intro', type: 'title', title: '测试', subtitle: '' },
        { id: 'main', type: 'content', title: '主要内容', points: [] }
      ]
    }
    const segments = [
      { id: 'intro', text: '开场文字' },
      { id: 'main', text: '正文文字' }
    ]

    const result = await synthesizeAndTimestamp(
      segments, slides, mockTTS as any, '/tmp/test-output'
    )

    expect(result.slides[0].startSec).toBe(0)
    expect(result.slides[0].endSec).toBeCloseTo(3.2)
    expect(result.slides[1].startSec).toBeCloseTo(3.2)
    expect(result.slides[1].endSec).toBeCloseTo(11.9)
  })
})
