import React from 'react'
import { useFadeIn } from '../../../animations'
import type { HighlightSlide as HighlightSlideType } from '../../../types'
import { colors, layout, slideThemes } from '../theme'
import { SlideLayout } from './SlideLayout'

/**
 * HighlightSlide — 金句高亮幻灯片
 * 主题色：琥珀 (#ffb800)
 * 居中大引号金句 + 辅助说明文字
 */
export const HighlightSlide: React.FC<{ slide: HighlightSlideType }> = ({ slide }) => {
  const theme = slideThemes.highlight

  const titleOpacity = useFadeIn(0, 20)
  const quoteOpacity = useFadeIn(15, 30)
  const bodyOpacity = useFadeIn(35, 20)
  const decorOpacity = useFadeIn(5, 20)

  // 字幕条显示 quote 内容
  const caption = slide.quote

  return (
    <SlideLayout caption={caption} accentColor={theme.accent}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${layout.paddingV}px ${layout.paddingH + 60}px`,
        position: 'relative',
        textAlign: 'center',
      }}>
        {/* 标题 */}
        <div style={{
          opacity: titleOpacity,
          marginBottom: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{
            display: 'inline-block',
            width: 30,
            height: 1,
            background: theme.accent,
          }} />
          <span style={{
            fontSize: 24,
            color: theme.accent,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            fontWeight: 600,
          }}>
            {slide.title}
          </span>
          <span style={{
            display: 'inline-block',
            width: 30,
            height: 1,
            background: theme.accent,
          }} />
        </div>

        {/* 装饰性大引号（左上角） */}
        <div style={{
          position: 'absolute',
          top: layout.paddingV - 20,
          left: layout.paddingH + 20,
          fontSize: 200,
          lineHeight: 1,
          color: theme.accentDim,
          fontFamily: 'Georgia, serif',
          opacity: decorOpacity,
          userSelect: 'none' as const,
          pointerEvents: 'none' as const,
        }}>
          "
        </div>

        {/* 引言卡片 */}
        <div style={{
          opacity: quoteOpacity,
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 16,
          border: `1px solid ${theme.accentBorder}`,
          padding: '48px 64px',
          position: 'relative',
          maxWidth: '100%',
        }}>
          {/* 卡片顶部左侧的琥珀色高亮条 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 48,
            right: 48,
            height: 2,
            background: `linear-gradient(90deg, ${theme.accent} 0%, transparent 100%)`,
            borderRadius: '0 0 2px 2px',
          }} />

          <blockquote style={{
            fontSize: 64,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            lineHeight: 1.45,
            letterSpacing: '-0.01em',
          }}>
            {slide.quote}
          </blockquote>
        </div>

        {/* 辅助说明 */}
        {slide.body && (
          <p style={{
            fontSize: 32,
            color: colors.textMuted,
            marginTop: 40,
            opacity: bodyOpacity,
            lineHeight: 1.6,
            letterSpacing: '0.02em',
          }}>
            {slide.body}
          </p>
        )}
      </div>
    </SlideLayout>
  )
}
