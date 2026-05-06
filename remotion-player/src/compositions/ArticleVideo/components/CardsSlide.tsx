import React from 'react'
import { useFadeIn } from '../../../animations'
import type { Card, CardsSlide as CardsSlideType } from '../../../types'
import { colors, layout, slideThemes } from '../theme'
import { SlideLayout } from './SlideLayout'

/**
 * CardsSlide — 卡片网格幻灯片
 * 主题色：紫色 (#c77dff)
 * 每张卡片独立的霓虹色边框 + 图标 + 标签 + 说明
 */

// 每张卡片使用的强调色（循环使用4色系）
const CARD_ACCENT_COLORS = [
  { accent: '#00ff88', dim: 'rgba(0,255,136,0.12)', border: 'rgba(0,255,136,0.3)' },
  { accent: '#00d4ff', dim: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.3)' },
  { accent: '#ffb800', dim: 'rgba(255,184,0,0.12)', border: 'rgba(255,184,0,0.3)' },
  { accent: '#c77dff', dim: 'rgba(199,125,255,0.12)', border: 'rgba(199,125,255,0.3)' },
  { accent: '#ff4757', dim: 'rgba(255,71,87,0.12)', border: 'rgba(255,71,87,0.3)' },
]

const CardItem: React.FC<{ card: Card; index: number; totalCards: number }> = ({
  card,
  index,
  totalCards,
}) => {
  const opacity = useFadeIn(index * 12, 20)
  const cardColors = CARD_ACCENT_COLORS[index % CARD_ACCENT_COLORS.length]

  // 根据卡片总数动态决定最小宽度
  const minWidth = totalCards <= 3 ? 280 : totalCards <= 4 ? 260 : 220

  return (
    <div style={{
      minWidth,
      flex: '1 1 0',
      maxWidth: 340,
      padding: '32px 28px',
      borderRadius: 16,
      border: `1px solid ${cardColors.border}`,
      background: cardColors.dim,
      opacity,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 卡片顶部强调线 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: cardColors.accent,
        boxShadow: `0 0 8px ${cardColors.accent}`,
      }} />

      {/* 图标 */}
      <div style={{
        fontSize: 52,
        lineHeight: 1,
        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))',
      }}>
        {card.icon}
      </div>

      {/* 卡片标题 */}
      <div style={{
        fontSize: 28,
        fontWeight: 600,
        color: cardColors.accent,
        lineHeight: 1.3,
        letterSpacing: '0.01em',
      }}>
        {card.label}
      </div>

      {/* 分隔线 */}
      <div style={{
        height: 1,
        background: `rgba(255,255,255,0.06)`,
      }} />

      {/* 卡片描述 */}
      <div style={{
        fontSize: 22,
        color: colors.textMuted,
        lineHeight: 1.6,
        letterSpacing: '0.01em',
      }}>
        {card.desc}
      </div>
    </div>
  )
}

export const CardsSlide: React.FC<{ slide: CardsSlideType }> = ({ slide }) => {
  const theme = slideThemes.cards
  const titleOpacity = useFadeIn(0, 30)

  // 字幕条显示标题
  const caption = slide.title

  return (
    <SlideLayout caption={caption} accentColor={theme.accent}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `${layout.paddingV}px ${layout.paddingH}px`,
      }}>
        {/* 标题区域 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginBottom: 44,
          opacity: titleOpacity,
        }}>
          <div style={{
            width: 6,
            height: 52,
            background: theme.accent,
            borderRadius: 3,
            flexShrink: 0,
            boxShadow: `0 0 12px ${theme.accent}`,
          }} />
          <h2 style={{
            fontSize: 60,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}>
            {slide.title}
          </h2>
        </div>

        {/* 卡片行（flex wrap 自动适配数量） */}
        <div style={{
          display: 'flex',
          gap: 28,
          justifyContent: slide.cards.length <= 3 ? 'center' : 'flex-start',
          flexWrap: 'wrap' as const,
          flex: 1,
          alignContent: 'flex-start',
        }}>
          {slide.cards.map((card, i) => (
            <CardItem key={i} card={card} index={i} totalCards={slide.cards.length} />
          ))}
        </div>
      </div>
    </SlideLayout>
  )
}
