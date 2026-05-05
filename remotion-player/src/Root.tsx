import React from 'react'
import { Composition } from 'remotion'
import { ArticleVideo } from './compositions/ArticleVideo/index'
import type { SlidesJson } from './types'

const DEV_SLIDES: SlidesJson = {
  title: '开发预览',
  slides: [
    { id: 'intro', type: 'title', title: 'Article to Podcast', subtitle: '开发预览模式', startSec: 0, endSec: 5 },
    { id: 'content', type: 'content', title: '功能列表', points: ['口播脚本生成', '幻灯片自动布局', '语音合成'], startSec: 5, endSec: 15 },
  ]
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ArticleVideo"
        component={ArticleVideo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ slidesData: DEV_SLIDES }}
        calculateMetadata={async ({ props }) => {
          const lastSlide = props.slidesData.slides.at(-1)
          const totalSec = lastSlide?.endSec ?? 15
          return { durationInFrames: Math.ceil(totalSec * 30) }
        }}
      />
    </>
  )
}
