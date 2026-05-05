import { describe, it, expect } from 'vitest'
import { parseScript } from '../parser.js'

const SAMPLE_SCRIPT = `---
title: AI Agent 的前世今生
slide_markers:
  - intro
  - what-is-agent
---

<!-- SLIDE: intro -->
好，今天我们来聊 AI Agent。
它是什么？

<!-- SLIDE: what-is-agent -->
AI Agent 就像数字员工。
你给它目标，它自己想办法。
`

describe('parseScript', () => {
  it('解析 frontmatter 标题和 slide_markers', () => {
    const result = parseScript(SAMPLE_SCRIPT)
    expect(result.frontmatter.title).toBe('AI Agent 的前世今生')
    expect(result.frontmatter.slide_markers).toEqual(['intro', 'what-is-agent'])
  })

  it('按 SLIDE 注释分割段落', () => {
    const result = parseScript(SAMPLE_SCRIPT)
    expect(result.segments).toHaveLength(2)
    expect(result.segments[0].id).toBe('intro')
    expect(result.segments[0].text).toContain('AI Agent')
    expect(result.segments[1].id).toBe('what-is-agent')
  })
})

describe('parseScript ID 校验', () => {
  it('段落 id 与 slide_markers 不一致时抛出错误', () => {
    const badScript = `---
title: test
slide_markers:
  - intro
  - missing-slide
---

<!-- SLIDE: intro -->
文本内容
`
    expect(() => parseScript(badScript)).toThrow('SLIDE ID 不匹配')
  })
})
