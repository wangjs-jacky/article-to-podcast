import matter from 'gray-matter'
import type { ScriptFrontmatter, ScriptSegment } from './types.js'

export interface ParsedScript {
  frontmatter: ScriptFrontmatter
  segments: ScriptSegment[]
}

export function parseScript(content: string): ParsedScript {
  const { data, content: body } = matter(content)
  const frontmatter = data as ScriptFrontmatter

  const slideRegex = /<!--\s*SLIDE:\s*(\S+)\s*-->/g
  const parts = body.split(slideRegex)
  // split 结果：[前置内容, id1, text1, id2, text2, ...]，第一项为标记前内容（丢弃）
  const segments: ScriptSegment[] = []
  for (let i = 1; i < parts.length; i += 2) {
    segments.push({ id: parts[i].trim(), text: (parts[i + 1] ?? '').trim() })
  }

  const parsedIds = segments.map(s => s.id)
  const expectedIds = frontmatter.slide_markers
  const mismatch =
    parsedIds.length !== expectedIds.length ||
    parsedIds.some((id, i) => id !== expectedIds[i])

  if (mismatch) {
    throw new Error(
      `SLIDE ID 不匹配：script.md 中的 [${parsedIds}] 与 frontmatter 中的 [${expectedIds}] 不一致`
    )
  }

  return { frontmatter, segments }
}
