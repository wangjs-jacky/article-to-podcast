import React from 'react'
import type { Slide } from '../../types'
import { TitleSlide } from './components/TitleSlide'
import { ContentSlide } from './components/ContentSlide'
import { CardsSlide } from './components/CardsSlide'
import { HighlightSlide } from './components/HighlightSlide'
import { ComparisonSlide } from './components/ComparisonSlide'
import { SlideTransition, variantForSlide } from './components/SlideTransition'

export const SlideRenderer: React.FC<{ slide: Slide; index?: number }> = ({ slide, index = 0 }) => {
  let inner: React.ReactNode
  switch (slide.type) {
    case 'title':      inner = <TitleSlide slide={slide} />; break
    case 'content':    inner = <ContentSlide slide={slide} />; break
    case 'cards':      inner = <CardsSlide slide={slide} />; break
    case 'highlight':  inner = <HighlightSlide slide={slide} />; break
    case 'comparison': inner = <ComparisonSlide slide={slide} />; break
    default:           return null
  }

  // 第一张（封面）用更稳的 fade-up，后续幻灯片轮换四种入场效果
  const variant = index === 0 ? 'fade-up' : variantForSlide(index - 1)
  return <SlideTransition variant={variant}>{inner}</SlideTransition>
}
