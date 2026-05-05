import React from 'react'
import { Composition } from 'remotion'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ArticleVideo"
        component={() => <div>placeholder</div>}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
