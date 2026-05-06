import React from 'react'
import { useFadeIn } from '../../../animations'
import type { TitleSlide as TitleSlideType } from '../../../types'
import { colors, layout, slideThemes } from '../theme'
import { SlideLayout } from './SlideLayout'

/**
 * TitleSlide — 封面幻灯片
 * 主题色：霓虹绿 (#00ff88)
 * 居中大标题 + 副标题 + 底部字幕条显示副标题
 */
export const TitleSlide: React.FC<{ slide: TitleSlideType }> = ({ slide }) => {
  const theme = slideThemes.title

  const titleOpacity = useFadeIn(0, 30)
  const titleScale = 1.04 - 0.04 * titleOpacity
  const subtitleOpacity = useFadeIn(20, 25)
  const decorLineOpacity = useFadeIn(10, 20)

  // 字幕条文字：副标题（或主标题）
  const caption = slide.subtitle ?? slide.title

  return (
    <SlideLayout
      caption={caption}
      accentColor={theme.accent}
    >
      {/* 中央内容区 */}
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${layout.paddingV}px ${layout.paddingH}px`,
        position: 'relative',
      }}>
        {/* 大标题上方的装饰小标签 */}
        <div style={{
          fontSize: 20,
          color: theme.accent,
          letterSpacing: '0.25em',
          textTransform: 'uppercase' as const,
          fontWeight: 500,
          opacity: decorLineOpacity,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{
            display: 'inline-block',
            width: 40,
            height: 1,
            background: theme.accent,
          }} />
          PODCAST
          <span style={{
            display: 'inline-block',
            width: 40,
            height: 1,
            background: theme.accent,
          }} />
        </div>

        {/* 主标题 */}
        <h1 style={{
          fontSize: 88,
          fontWeight: 700,
          color: colors.text,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}>
          {slide.title}
        </h1>

        {/* 标题下方的霓虹绿分割线 */}
        <div style={{
          width: 80,
          height: 3,
          background: theme.accent,
          marginTop: 40,
          marginBottom: 32,
          opacity: decorLineOpacity,
          borderRadius: 2,
          boxShadow: `0 0 10px ${theme.accent}`,
        }} />

        {/* 副标题 */}
        {slide.subtitle && (
          <p style={{
            fontSize: 40,
            color: colors.textMuted,
            opacity: subtitleOpacity,
            margin: 0,
            textAlign: 'center',
            letterSpacing: '0.02em',
            lineHeight: 1.5,
          }}>
            {slide.subtitle}
          </p>
        )}

        {/* 背景大字装饰（半透明，增加层次感） */}
        <div style={{
          position: 'absolute',
          bottom: -20,
          right: layout.paddingH - 40,
          fontSize: 280,
          fontWeight: 900,
          color: 'rgba(0, 255, 136, 0.03)',
          lineHeight: 1,
          userSelect: 'none' as const,
          pointerEvents: 'none' as const,
          letterSpacing: '-0.05em',
        }}>
          AI
        </div>
      </div>
    </SlideLayout>
  )
}
