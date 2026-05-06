import React from 'react'
import { AbsoluteFill } from 'remotion'
import type { Slide } from '../types'
import { SlideRenderer } from './ArticleVideo/SlideRenderer'

interface Props {
  slide: Slide
}

// 单张幻灯片预览 Composition，用于 Step 2.5 生成静态 PNG 预览
export const PreviewSlide: React.FC<Props> = ({ slide }) => {
  // 注入 mock 时间戳（动画基于相对帧 0 计算，不影响视觉效果）
  const slideWithTime = { ...slide, startSec: 0, endSec: 10 }
  return (
    <AbsoluteFill style={{ background: '#0a0a0b' }}>
      <SlideRenderer slide={slideWithTime} />
    </AbsoluteFill>
  )
}
