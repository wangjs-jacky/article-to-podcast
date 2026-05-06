import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { TTSProvider, TTSOptions } from './tts/interface.js'
import type { ScriptSegment, SlidesJson } from './types.js'

export async function synthesizeAndTimestamp(
  segments: ScriptSegment[],
  slides: SlidesJson,
  tts: TTSProvider,
  outputDir: string,
  ttsOverrides?: Record<string, TTSOptions>
): Promise<SlidesJson> {
  mkdirSync(outputDir, { recursive: true })

  const segmentFiles: string[] = []
  let cursor = 0
  const updatedSlides = [...slides.slides]

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const segPath = join(outputDir, `.tmp_seg_${seg.id}.mp3`)
    segmentFiles.push(segPath)

    const options = ttsOverrides?.[seg.id]
    const duration = await tts.synthesize(seg.text, segPath, options)

    const slide = updatedSlides.find(s => s.id === seg.id)
    if (slide) {
      slide.startSec = cursor
      slide.endSec = cursor + duration
    }
    cursor += duration

    console.log(`  [${i + 1}/${segments.length}] ${seg.id} (${duration.toFixed(1)}s)`)
  }

  const listFile = join(outputDir, '.concat_list.txt')
  writeFileSync(listFile, segmentFiles.map(f => `file '${f}'`).join('\n'))
  const audioOut = join(outputDir, 'audio.mp3')
  execSync(`ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${audioOut}" -y`, { stdio: 'pipe' })

  return { ...slides, slides: updatedSlides }
}
