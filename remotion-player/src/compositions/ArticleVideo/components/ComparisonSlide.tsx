import React from 'react'
import { useFadeIn, useSlideInLeft } from '../../../animations'
import type { ComparisonSlide as ComparisonSlideType } from '../../../types'
import { colors, layout } from '../theme'
import { SlideLayout } from './SlideLayout'

/**
 * ComparisonSlide — 正反对比幻灯片
 * 左侧（错误）：红色 #ff4757
 * 右侧（正确）：霓虹绿 #00ff88
 */

// 错误列颜色
const WRONG_COLORS = {
  accent: '#ff4757',
  dim: 'rgba(255,71,87,0.1)',
  border: 'rgba(255,71,87,0.3)',
  headerBg: 'rgba(255,71,87,0.12)',
}

// 正确列颜色
const CORRECT_COLORS = {
  accent: '#00ff88',
  dim: 'rgba(0,255,136,0.1)',
  border: 'rgba(0,255,136,0.3)',
  headerBg: 'rgba(0,255,136,0.12)',
}

const ComparisonItem: React.FC<{
  text: string
  index: number
  isCorrect: boolean
}> = ({ text, index, isCorrect }) => {
  const { opacity, translateX } = useSlideInLeft(index * 10 + (isCorrect ? 0 : 5))
  const accent = isCorrect ? CORRECT_COLORS.accent : WRONG_COLORS.accent

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      opacity,
      transform: `translateX(${translateX}px)`,
      padding: '14px 16px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(255,255,255,0.05)`,
    }}>
      {/* ✓ / ✗ 图标 */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: isCorrect ? CORRECT_COLORS.dim : WRONG_COLORS.dim,
        border: `1px solid ${accent}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 2,
        fontSize: 18,
        color: accent,
        fontWeight: 700,
      }}>
        {isCorrect ? '✓' : '✗'}
      </div>
      <span style={{
        fontSize: 30,
        color: colors.text,
        lineHeight: 1.55,
        letterSpacing: '0.01em',
      }}>
        {text}
      </span>
    </div>
  )
}

const ComparisonColumn: React.FC<{
  label: string
  items: string[]
  isCorrect: boolean
  delayFadeIn: number
}> = ({ label, items, isCorrect, delayFadeIn }) => {
  const headerOpacity = useFadeIn(delayFadeIn, 20)
  const colColors = isCorrect ? CORRECT_COLORS : WRONG_COLORS

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      borderRadius: 16,
      border: `1px solid ${colColors.border}`,
      overflow: 'hidden',
      background: colColors.dim,
    }}>
      {/* 列头 */}
      <div style={{
        padding: '24px 32px',
        background: colColors.headerBg,
        borderBottom: `1px solid ${colColors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: headerOpacity,
      }}>
        {/* 列头图标 */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: colColors.dim,
          border: `2px solid ${colColors.accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color: colColors.accent,
          fontWeight: 700,
          flexShrink: 0,
          boxShadow: `0 0 8px ${colColors.accent}`,
        }}>
          {isCorrect ? '✓' : '✗'}
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: 700,
          color: colColors.accent,
          letterSpacing: '0.01em',
        }}>
          {label}
        </div>
      </div>

      {/* 条目列表 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '24px 24px',
        flex: 1,
      }}>
        {items.map((item, i) => (
          <ComparisonItem key={i} text={item} index={i} isCorrect={isCorrect} />
        ))}
      </div>
    </div>
  )
}

export const ComparisonSlide: React.FC<{ slide: ComparisonSlideType }> = ({ slide }) => {
  const titleOpacity = useFadeIn(0, 25)

  // 字幕条显示标题
  const caption = slide.title

  return (
    <SlideLayout caption={caption} accentColor="#00ff88">
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `${layout.paddingV - 12}px ${layout.paddingH}px`,
      }}>
        {/* 标题 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          marginBottom: 36,
          opacity: titleOpacity,
        }}>
          {/* 标题两侧的渐变线 */}
          <div style={{
            flex: 1,
            height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,71,87,0.4) 100%)',
          }} />
          <h2 style={{
            fontSize: 56,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap' as const,
          }}>
            {slide.title}
          </h2>
          <div style={{
            flex: 1,
            height: 1,
            background: 'linear-gradient(90deg, rgba(0,255,136,0.4) 0%, transparent 100%)',
          }} />
        </div>

        {/* 双列对比区域 */}
        <div style={{
          display: 'flex',
          gap: 36,
          flex: 1,
        }}>
          <ComparisonColumn
            label={slide.wrong.label}
            items={slide.wrong.items}
            isCorrect={false}
            delayFadeIn={15}
          />
          <ComparisonColumn
            label={slide.correct.label}
            items={slide.correct.items}
            isCorrect={true}
            delayFadeIn={25}
          />
        </div>
      </div>
    </SlideLayout>
  )
}
