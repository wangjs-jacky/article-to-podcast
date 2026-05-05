import React from 'react'
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
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

  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      {/* staticFile() 从 remotion-player/public/ 目录读取 */}
      <Audio src={staticFile('audio.mp3')} />
      <SlideRenderer slide={currentSlide} />
    </AbsoluteFill>
  )
}
