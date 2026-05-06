export interface SpeakerInfo {
  id: string
  name: string
  gender: 'male' | 'female'
  charsPerSecond: number
  tags: string[]
}

const speakers: SpeakerInfo[] = [
  // 女声
  { id: 'zh_female_vv_uranus_bigtts', name: 'Vivi', gender: 'female', charsPerSecond: 3.9, tags: ['通用'] },
  { id: 'zh_female_xiaohe_uranus_bigtts', name: '小何', gender: 'female', charsPerSecond: 4.0, tags: ['通用'] },
  { id: 'zh_female_sophie_uranus_bigtts', name: '魅力苏菲', gender: 'female', charsPerSecond: 4.0, tags: ['通用'] },
  { id: 'zh_female_qingxinnvsheng_uranus_bigtts', name: '清新女声', gender: 'female', charsPerSecond: 3.3, tags: ['通用'] },
  { id: 'zh_female_shuangkuaisisi_uranus_bigtts', name: '爽快思思', gender: 'female', charsPerSecond: 4.2, tags: ['通用'] },
  { id: 'zh_female_tianmeixiaoyuan_uranus_bigtts', name: '甜美小源', gender: 'female', charsPerSecond: 3.9, tags: ['通用'] },
  { id: 'zh_female_cancan_uranus_bigtts', name: '知性灿灿', gender: 'female', charsPerSecond: 3.6, tags: ['角色扮演'] },
  { id: 'zh_female_sajiaoxuemei_uranus_bigtts', name: '撒娇学妹', gender: 'female', charsPerSecond: 3.6, tags: ['角色扮演'] },
  { id: 'zh_female_meilinvyou_uranus_bigtts', name: '魅力女友', gender: 'female', charsPerSecond: 3.3, tags: ['视频配音'] },
  { id: 'zh_female_tvbnv_uranus_bigtts', name: 'TVB女声', gender: 'female', charsPerSecond: 3.3, tags: ['通用'] },
  { id: 'zh_female_wenroumama_uranus_bigtts', name: '温柔妈妈', gender: 'female', charsPerSecond: 3.3, tags: ['通用'] },
  { id: 'zh_female_kefunvsheng_uranus_bigtts', name: '暖阳女声', gender: 'female', charsPerSecond: 3.9, tags: ['客服'] },
  { id: 'zh_female_jitangnv_uranus_bigtts', name: '鸡汤女', gender: 'female', charsPerSecond: 3.2, tags: ['通用'] },
  { id: 'zh_female_liuchangnv_uranus_bigtts', name: '流畅女声', gender: 'female', charsPerSecond: 3.5, tags: ['视频配音'] },
  // 男声
  { id: 'zh_male_m191_uranus_bigtts', name: '云舟', gender: 'male', charsPerSecond: 4.0, tags: ['通用'] },
  { id: 'zh_male_taocheng_uranus_bigtts', name: '小天', gender: 'male', charsPerSecond: 4.3, tags: ['通用'] },
  { id: 'zh_male_liufei_uranus_bigtts', name: '刘飞', gender: 'male', charsPerSecond: 4.2, tags: ['通用'] },
  { id: 'zh_male_dayi_uranus_bigtts', name: '大壹', gender: 'male', charsPerSecond: 5.1, tags: ['视频配音'] },
  { id: 'zh_male_ruyayichen_uranus_bigtts', name: '儒雅逸辰', gender: 'male', charsPerSecond: 3.9, tags: ['视频配音'] },
  { id: 'zh_male_jieshuoxiaoming_uranus_bigtts', name: '解说小明', gender: 'male', charsPerSecond: 4.2, tags: ['解说'] },
  { id: 'zh_male_shaonianzixin_uranus_bigtts', name: '少年梓辛', gender: 'male', charsPerSecond: 4.0, tags: ['通用'] },
]

export function resolveSpeaker(nameOrId: string): SpeakerInfo {
  const byName = speakers.find(s => s.name === nameOrId)
  if (byName) return byName
  const byId = speakers.find(s => s.id === nameOrId)
  if (byId) return byId
  throw new Error(`未知音色: "${nameOrId}"。可用音色: ${speakers.map(s => s.name).join(', ')}`)
}

export function listSpeakers(): SpeakerInfo[] {
  return [...speakers]
}
