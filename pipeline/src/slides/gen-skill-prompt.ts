/**
 * 从 slideRegistry 自动生成 AI 提示词文档
 * 输出到 skills/article-to-podcast/SLIDES.generated.md
 * 运行：npm run gen-skill-prompt
 */
import { writeFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { slideRegistry } from './registry.js'

// 项目根目录（pipeline/src/slides/ 上溯三层）
const projectRoot = new URL('../../..', import.meta.url).pathname
const outputPath = join(
  projectRoot,
  'skills',
  'article-to-podcast',
  'SLIDES.generated.md',
)

// 需要从输出中过滤掉的 BaseSlide 基础字段
const BASE_FIELDS = new Set(['id', 'startSec', 'endSec'])

/**
 * 将 zod typeName 转为可读的类型字符串
 */
function getTypeName(field: z.ZodTypeAny): string {
  const def = field._def as { typeName: string; value?: unknown; innerType?: z.ZodTypeAny }
  switch (def.typeName) {
    case 'ZodString':
      return 'string'
    case 'ZodNumber':
      return 'number'
    case 'ZodBoolean':
      return 'boolean'
    case 'ZodLiteral':
      return `"${def.value}"`
    case 'ZodOptional':
      return getTypeName(def.innerType as z.ZodTypeAny)
    case 'ZodArray':
      return `${getTypeName((def as unknown as { type: z.ZodTypeAny }).type)}[]`
    case 'ZodObject':
      return 'object'
    default:
      return def.typeName.replace('Zod', '').toLowerCase()
  }
}

/**
 * 获取字段的 description（处理 optional 包装的情况）
 */
function getDescription(field: z.ZodTypeAny): string | undefined {
  // 先尝试直接取
  if (field.description) return field.description
  // 再尝试从 optional 内部取
  const def = field._def as { typeName: string; innerType?: z.ZodTypeAny }
  if (def.typeName === 'ZodOptional' && def.innerType) {
    return def.innerType.description
  }
  return undefined
}

/**
 * 判断字段是否为 optional
 */
function isOptional(field: z.ZodTypeAny): boolean {
  const def = field._def as { typeName: string }
  return def.typeName === 'ZodOptional'
}

/**
 * 判断字段是否为 ZodObject（处理 optional 包装）
 */
function isObject(field: z.ZodTypeAny): boolean {
  const def = field._def as { typeName: string; innerType?: z.ZodTypeAny }
  if (def.typeName === 'ZodObject') return true
  if (def.typeName === 'ZodOptional' && def.innerType) {
    return isObject(def.innerType)
  }
  return false
}

/**
 * 判断字段是否为 ZodArray（处理 optional 包装）
 */
function isArray(field: z.ZodTypeAny): boolean {
  const def = field._def as { typeName: string; innerType?: z.ZodTypeAny }
  if (def.typeName === 'ZodArray') return true
  if (def.typeName === 'ZodOptional' && def.innerType) {
    return isArray(def.innerType)
  }
  return false
}

/**
 * 获取 ZodArray 的元素类型（处理 optional 包装）
 */
function getArrayInnerType(field: z.ZodTypeAny): z.ZodTypeAny {
  const def = field._def as { typeName: string; innerType?: z.ZodTypeAny; type?: z.ZodTypeAny }
  if (def.typeName === 'ZodArray') return def.type as z.ZodTypeAny
  if (def.typeName === 'ZodOptional' && def.innerType) {
    return getArrayInnerType(def.innerType)
  }
  throw new Error('Not a ZodArray')
}

/**
 * 获取 ZodObject 的 shape（处理 optional 包装）
 */
function getObjectShape(field: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  const def = field._def as { typeName: string; innerType?: z.ZodTypeAny; shape?: () => Record<string, z.ZodTypeAny> }
  if (def.typeName === 'ZodObject') return (def.shape as () => Record<string, z.ZodTypeAny>)()
  if (def.typeName === 'ZodOptional' && def.innerType) {
    return getObjectShape(def.innerType)
  }
  throw new Error('Not a ZodObject')
}

/**
 * 递归渲染字段列表为 markdown 行
 * @param shape - zod object shape
 * @param indent - 当前缩进（空格数）
 * @param skipFields - 需要跳过的字段名集合
 */
function renderFields(
  shape: Record<string, z.ZodTypeAny>,
  indent = 0,
  skipFields: Set<string> = new Set(),
): string {
  const prefix = ' '.repeat(indent)
  const lines: string[] = []

  for (const [key, field] of Object.entries(shape)) {
    if (skipFields.has(key)) continue

    const optional = isOptional(field)
    const typeName = getTypeName(field)
    const desc = getDescription(field)

    // 基础字段行
    const optionalMark = optional ? ', 可选' : ''
    const descPart = desc ? ` — ${desc}` : ''
    lines.push(`${prefix}- \`${key}\` (${typeName}${optionalMark})${descPart}`)

    // 若为 object，递归展开子字段
    if (isObject(field)) {
      const subShape = getObjectShape(field)
      lines.push(renderFields(subShape, indent + 2))
    }

    // 若为 array，且元素是 object，递归展开元素子字段
    if (isArray(field)) {
      const innerType = getArrayInnerType(field)
      const innerDef = innerType._def as { typeName: string }
      if (innerDef.typeName === 'ZodObject') {
        const subShape = getObjectShape(innerType)
        lines.push(renderFields(subShape, indent + 2))
      }
    }
  }

  return lines.filter(Boolean).join('\n')
}

// 生成 markdown 内容
const sections: string[] = [
  '<!-- 自动生成，请勿手动编辑。运行 `npm run gen-skill-prompt` 更新。 -->',
  '',
  '## 可用幻灯片类型',
]

for (const [slideType, entry] of Object.entries(slideRegistry)) {
  const { schema, aiHint, examples } = entry as {
    schema: z.ZodObject<Record<string, z.ZodTypeAny>>
    aiHint: string
    examples: unknown[]
  }

  const shape = schema.shape as Record<string, z.ZodTypeAny>
  const fieldsMarkdown = renderFields(shape, 0, BASE_FIELDS)
  const exampleJson = JSON.stringify(examples[0], null, 0)
    // 让示例 json 对齐好看：保持单行
    .replace(/^\{/, '{ ')
    .replace(/\}$/, ' }')

  sections.push('')
  sections.push(`### ${slideType}`)
  sections.push(`**何时使用：** ${aiHint}`)
  sections.push('')
  sections.push('**字段：**')
  sections.push(fieldsMarkdown)
  sections.push('')
  sections.push('**示例：**')
  sections.push('```json')
  sections.push(exampleJson)
  sections.push('```')
  sections.push('')
  sections.push('---')
}

const markdown = sections.join('\n')

writeFileSync(outputPath, markdown, 'utf8')
console.log(`✅ 已生成：${outputPath}`)
