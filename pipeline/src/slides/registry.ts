import { z } from 'zod'

// startSec/endSec 是 pipeline 写入的时间戳字段，AI 不需要关心
const BaseSlideSchema = z.object({
  id: z.string(),
  startSec: z.number().optional(),
  endSec: z.number().optional(),
})

export const TitleSlideSchema = BaseSlideSchema.extend({
  type: z.literal('title'),
  title: z.string().describe('主标题，建议 4-12 字'),
  subtitle: z.string().optional().describe('副标题，建议 8-20 字'),
})

export const ContentSlideSchema = BaseSlideSchema.extend({
  type: z.literal('content'),
  title: z.string().describe('段落标题'),
  points: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe('要点列表，建议 3-5 条，每条 8-20 字'),
})

export const CardsSlideSchema = BaseSlideSchema.extend({
  type: z.literal('cards'),
  title: z.string(),
  cards: z
    .array(
      z.object({
        icon: z.string().describe('单个 emoji 字符'),
        label: z.string().describe('卡片标题，4-8 字'),
        desc: z.string().describe('卡片描述，10-20 字'),
      }),
    )
    .min(2)
    .max(4),
})

export const HighlightSlideSchema = BaseSlideSchema.extend({
  type: z.literal('highlight'),
  title: z.string(),
  quote: z.string().describe('核心引用句，15-40 字，带引号'),
  body: z.string().optional().describe('补充说明，可选'),
})

export const ComparisonSlideSchema = BaseSlideSchema.extend({
  type: z.literal('comparison'),
  title: z.string(),
  correct: z.object({
    label: z.string().describe('正确做法的标题'),
    items: z.array(z.string()).min(1).max(4),
  }),
  wrong: z.object({
    label: z.string().describe('错误做法的标题'),
    items: z.array(z.string()).min(1).max(4),
  }),
})

// 所有 Slide 类型的联合 Schema，用 discriminatedUnion 实现精确类型区分
export const SlideUnionSchema = z.discriminatedUnion('type', [
  TitleSlideSchema,
  ContentSlideSchema,
  CardsSlideSchema,
  HighlightSlideSchema,
  ComparisonSlideSchema,
])

// 顶层 slides.json 的完整结构 Schema
export const SlidesJsonSchema = z.object({
  title: z.string(),
  slides: z.array(SlideUnionSchema),
})

// Slide 注册中心：包含 schema、AI 使用提示和示例
export const slideRegistry = {
  title: {
    schema: TitleSlideSchema,
    aiHint: '视频开头的封面页，**仅第一张 SLIDE 使用**',
    examples: [
      {
        id: 'intro',
        type: 'title',
        title: 'AI 时代的 UI 设计',
        subtitle: '从代码到设计的范式转移',
      },
    ],
  },
  content: {
    schema: ContentSlideSchema,
    aiHint: '列举要点（2-6 条）时使用，最常用的类型',
    examples: [
      {
        id: 's2',
        type: 'content',
        title: '三大设计原则',
        points: ['可读性优先', '一致性原则', '减少认知负担'],
      },
    ],
  },
  cards: {
    schema: CardsSlideSchema,
    aiHint: '展示 2-4 个并列概念/方案时使用，每个卡片有图标',
    examples: [
      {
        id: 's3',
        type: 'cards',
        title: '四种架构模式',
        cards: [
          { icon: '🏗️', label: '分层架构', desc: '经典三层结构，职责清晰' },
          { icon: '🔄', label: '事件驱动', desc: '松耦合，适合复杂业务' },
        ],
      },
    ],
  },
  highlight: {
    schema: HighlightSlideSchema,
    aiHint: '强调某句关键结论或引言时使用',
    examples: [
      {
        id: 's4',
        type: 'highlight',
        title: '核心洞察',
        quote: '"好的设计是让用户感觉不到设计的存在"',
      },
    ],
  },
  comparison: {
    schema: ComparisonSlideSchema,
    aiHint: '对比正确做法和错误做法时使用',
    examples: [
      {
        id: 's5',
        type: 'comparison',
        title: '接口设计对比',
        correct: { label: '✅ 推荐', items: ['语义化命名', '单一职责'] },
        wrong: { label: '❌ 避免', items: ['万能接口', '参数超过 5 个'] },
      },
    ],
  },
} as const
