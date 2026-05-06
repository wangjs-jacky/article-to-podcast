import React from 'react'
import { useFadeIn, useSlideInLeft } from '../../../animations'
import type { ContentSlide as ContentSlideType } from '../../../types'
import { colors, layout, slideThemes } from '../theme'
import { SlideLayout } from './SlideLayout'

/**
 * ContentSlide — 要点列表幻灯片
 * 主题色：天蓝 (#00d4ff)
 * 左侧图标 + 每行要点依次滑入
 */

const ContentPoint: React.FC<{ point: string; index: number; accentColor: string }> = ({
  point,
  index,
  accentColor,
}) => {
  const { opacity, translateX } = useSlideInLeft(index * 15)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 24,
      opacity,
      transform: `translateX(${translateX}px)`,
      padding: '20px 28px',
      // 玻璃卡片效果（半透明背景替代 backdrop-filter）
      background: 'rgba(255, 255, 255, 0.04)',
      borderRadius: 12,
      border: `1px solid rgba(255, 255, 255, 0.07)`,
      borderLeft: `3px solid ${accentColor}`,
    }}>
      {/* 序号圆圈 */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `rgba(${hexAccentToRgb(accentColor)}, 0.15)`,
        border: `1px solid ${accentColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 20,
        fontWeight: 700,
        color: accentColor,
        marginTop: 2,
      }}>
        {index + 1}
      </div>

      {/* 要点文字 */}
      <span style={{
        fontSize: 34,
        color: colors.text,
        lineHeight: 1.55,
        letterSpacing: '0.01em',
      }}>
        {point}
      </span>
    </div>
  )
}

export const ContentSlide: React.FC<{ slide: ContentSlideType }> = ({ slide }) => {
  const theme = slideThemes.content
  const titleOpacity = useFadeIn(0, 30)

  // 字幕条显示第一个要点内容（如有）或标题
  const caption = slide.points[0] ?? slide.title

  return (
    <SlideLayout caption={caption} accentColor={theme.accent}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `${layout.paddingV}px ${layout.paddingH}px`,
        gap: 0,
      }}>
        {/* 标题区域 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginBottom: 48,
          opacity: titleOpacity,
        }}>
          {/* 标题左侧色块 */}
          <div style={{
            width: 6,
            height: 56,
            background: theme.accent,
            borderRadius: 3,
            flexShrink: 0,
            boxShadow: `0 0 12px ${theme.accent}`,
          }} />
          <h2 style={{
            fontSize: 64,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}>
            {slide.title}
          </h2>
        </div>

        {/* 要点列表 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          flex: 1,
        }}>
          {slide.points.map((point, i) => (
            <ContentPoint
              key={i}
              point={point}
              index={i}
              accentColor={theme.accent}
            />
          ))}
        </div>
      </div>
    </SlideLayout>
  )
}

/** 将强调色 hex 转成 R,G,B 供 rgba() 使用 */
function hexAccentToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '0,212,255'
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r},${g},${b}`
}
