import { readFileSync } from 'fs'
import { join } from 'path'
import { SlidesJsonSchema } from './registry.js'

// 项目根目录（pipeline/src/slides/ 上溯三层）
const projectRoot = new URL('../../..', import.meta.url).pathname

// 支持 --output-name=<name> 指定 output 子目录
const outputNameArg = process.argv
  .find(a => a.startsWith('--output-name='))
  ?.split('=')[1]

const outputDir = outputNameArg
  ? join(projectRoot, 'output', outputNameArg)
  : join(projectRoot, 'output')

const slidesPath = join(outputDir, 'slides.json')

// 读取并校验 slides.json
let raw: unknown
try {
  raw = JSON.parse(readFileSync(slidesPath, 'utf8'))
} catch (err) {
  console.error(`❌ 无法读取文件：${slidesPath}`)
  console.error(err)
  process.exit(1)
}

const result = SlidesJsonSchema.safeParse(raw)
if (!result.success) {
  console.error('❌ slides.json 不符合 Schema：')
  console.error(result.error.format())
  process.exit(1)
}

console.log(`✅ slides.json 校验通过（${result.data.slides.length} 张幻灯片）`)
