
export enum ImageStyle {
  ModernTech3D = '现代科技 3D',
  PureAnime = '日系动漫风',
  ClayWorld = '可爱粘土风',
  NeoEditorial = '杂志插画风',
  MinimalBauhaus = '极简线条',
  EtherealFluid = '梦幻流体氛围',
  RetroCollage = '创意拼贴艺术',
  PixelArt = '8-bit 像素风',
  Risograph = '复古孔版印刷',
  PaperCutout = '手工剪纸艺',
  LofiDoodle = '手绘草图随笔',
  Whiteboard = '创意白板',
  MultiPanelManga = '多格漫画',
  Glassmorphism = '玻璃拟态风',
  Custom = '自定义风格'
}

export enum LayoutTemplate {
  WechatDefault = 'wechat-default',
  LatepostDepth = 'latepost-depth',
  WechatFt = 'wechat-ft',
  WechatAnthropic = 'wechat-anthropic',
  WechatTech = 'wechat-tech',
  WechatElegant = 'wechat-elegant',
  WechatDeepread = 'wechat-deepread',
  WechatNyt = 'wechat-nyt',
  WechatJonyive = 'wechat-jonyive',
  WechatMedium = 'wechat-medium',
  WechatApple = 'wechat-apple',
  KenyaEmptiness = 'kenya-emptiness',
  HischeEditorial = 'hische-editorial',
  AndoConcrete = 'ando-concrete',
  GaudiOrganic = 'gaudi-organic',
  Guardian = 'guardian',
  Nikkei = 'nikkei',
  Lemonde = 'lemonde'
}

export enum ImageStrategy {
  AI = 'AI 智能判断',
  Fixed = '根据段落配图'
}

export interface ImagePrompt {
  index: number;
  paragraphText: string;
  suggestedPrompt: string;
  reason: string;
}

export interface GeneratedImage {
  id: string;
  index: number;
  url: string;
  prompt: string;
}

export interface GeneratedCover {
  id: string;
  url: string;
  style: string;
}

export interface ArticleState {
  title: string;
  content: string;
  imageCount: number;
  imageStyle: ImageStyle;
  customStylePrompt?: string;
  imageStrategy: ImageStrategy;
  images: GeneratedImage[];
  covers: GeneratedCover[];
  selectedCoverIndex: number;
  selectedTemplate: LayoutTemplate;
  isAnalyzing: boolean;
  statusMessage: string;
}
