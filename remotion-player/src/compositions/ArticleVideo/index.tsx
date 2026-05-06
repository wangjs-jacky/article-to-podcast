import React from 'react'
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { SlidesJson } from '../../types'
import { SlideRenderer } from './SlideRenderer'

interface Props {
  slidesData: SlidesJson
}

export const ArticleVideo: React.FC<Props> = ({ slidesData }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentSec = frame / fps

  const currentSlide = slidesData.slides.find(
    s => s.startSec !== undefined && s.endSec !== undefined
      && currentSec >= s.startSec && currentSec < s.endSec
  ) ?? slidesData.slides[0]

  // slideStartFrame 让 Sequence 内部的 useCurrentFrame() 从 0 重新计数
  // 每张 slide 的入场动画都从相对帧 0 开始，不再受全局帧号影响
  const slideStartFrame = Math.round((currentSlide.startSec ?? 0) * fps)

  // 使用深色背景，避免 slide 切换时出现白色闪烁
  return (
    <AbsoluteFill style={{ background: '#0a0a0b' }}>
      <Audio src={staticFile('audio.mp3')} />
      <Sequence from={slideStartFrame} key={currentSlide.id}>
        <SlideRenderer slide={currentSlide} />
      </Sequence>
    </AbsoluteFill>
  )
}
