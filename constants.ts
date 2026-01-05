
import { ImageStyle } from './types';
export { STYLES } from './styles';

export const STYLE_PROMPT_MAP: Record<string, string> = {
  [ImageStyle.ModernTech3D]: 'Minimalist 3D render, geometric shapes, floating spheres and cubes, frosted glass and matte ceramic materials, subsurface scattering, Soft gradient lighting, clean studio background, isometric view, tech palette.',
  [ImageStyle.PureAnime]: 'Japanese anime manga style frame, digital illustration, clean line art, intricate background art details, cel shading, cinematic feel, beautiful detailed scenery.',
  [ImageStyle.ClayWorld]: 'Claymorphism style, smooth plasticine texture, soft rounded shapes, handmade feel with slight visible fingerprints and imperfections, stop-motion animation aesthetic.',
  [ImageStyle.NeoEditorial]: 'Flat vector art style with overall subtle grainy textures, Stylized characters with exaggerated artistic proportions, Metaphorical storytelling, limited retro color palette.',
  [ImageStyle.MinimalBauhaus]: 'Black ink lines on textured aged beige paper. Abstract geometric forms, Bauhaus design influence, Monochromatic with typically one single primary color accent.',
  [ImageStyle.EtherealFluid]: 'Organic fluid shapes, smooth gradients, translucent layers, soft blurred glass effect, Ethereal light leaks, dreamy atmosphere, calming bokeh lights.',
  [ImageStyle.RetroCollage]: 'Mixed media collage style, Vintage black and white photography cutouts mixed with colorful modern geometric shapes, pop art elements, torn paper edges.',
  [ImageStyle.PixelArt]: 'Detailed 16-bit pixel art style, sharp village pixels, retro video game aesthetic, isometric miniature world view, vibrant arcade colors.',
  [ImageStyle.Risograph]: 'Risograph printing effect, heavy coarse grain texture, stippling shading, Imperfect alignment of color layers (misprint effect), limited ink palette.',
  [ImageStyle.PaperCutout]: 'Paper cutout art style, diorama effect, Multiple layers of colored paper with distinct real cast shadows, soft overhead lighting.',
  [ImageStyle.LofiDoodle]: 'Loose pencil sketch or black marker doodle style, Rough wobbly lines, minimalist sketchy shading, notebook paper texture, authentic vibe.',
  [ImageStyle.Whiteboard]: 'Dry-erase marker drawing style on a whiteboard, Thick slightly textured marker lines, standard marker colors (black, blue, red), glossy white board surface with reflections.',
  [ImageStyle.MultiPanelManga]: 'A comic strip layout with multiple panels (sequential grid) illustrating the subject. Black and white manga drawing style, ink lines, halftone screen tones for shading, thick grid borders, speech bubbles, dynamic onomatopoeia.',
  [ImageStyle.Glassmorphism]: 'Glassmorphism UI style, abstract frosted glass elements with soft glowing white edges, strong background blur, light refraction, vibrant neon gradient background, modern high-tech aesthetic.',
};

const BASE_IMG_URL = 'https://github.com/FrankL1u/wxgzh-aiimages-assistant/blob/main/images/';

export const STYLE_METADATA: Record<string, { desc: string; scenario: string; previewUrl: string }> = {
  [ImageStyle.ModernTech3D]: {
    desc: '干净、磨砂玻璃与几何体的抽象组合',
    scenario: 'SaaS, B2B, 区块链, 数据报告',
    previewUrl: `${BASE_IMG_URL}ModernTech3D.png?raw=true`
  },
  [ImageStyle.PureAnime]: {
    desc: '高质量 2D 赛璐璐动画电影感',
    scenario: '动漫, 游戏, 轻小说, Z世代话题',
    previewUrl: `${BASE_IMG_URL}PureAnime.png?raw=true`
  },
  [ImageStyle.ClayWorld]: {
    desc: '圆润、手工感的 3D 橡皮泥模型',
    scenario: '教育, 亲子, 手工教程, 轻松话题',
    previewUrl: `${BASE_IMG_URL}ClayWorld.png?raw=true`
  },
  [ImageStyle.NeoEditorial]: {
    desc: '带有噪点纹理的复古扁平矢量画',
    scenario: '深度报道, 社会评论, 人物专访',
    previewUrl: `${BASE_IMG_URL}NeoEditorial.png?raw=true`
  },
  [ImageStyle.MinimalBauhaus]: {
    desc: '极简黑色线条与几何形状构图',
    scenario: '学术, 建筑, 高端咨询, 逻辑说明',
    previewUrl: `${BASE_IMG_URL}MinimalBauhaus.png?raw=true`
  },
  [ImageStyle.EtherealFluid]: {
    desc: '无具体物体的色彩流动与光斑',
    scenario: '心理健康, 冥想, 情感, 抽象概念',
    previewUrl: `${BASE_IMG_URL}EtherealFluid.png?raw=true`
  },
  [ImageStyle.RetroCollage]: {
    desc: '复古照片与波普元素的超现实组合',
    scenario: '创意写作, 脑洞大开, 历史回顾',
    previewUrl: `${BASE_IMG_URL}RetroCollage.png?raw=true`
  },
  [ImageStyle.PixelArt]: {
    desc: '精细的复古游戏机点阵像素艺术',
    scenario: '编程, Web3, 游戏开发, 黑客文化',
    previewUrl: `${BASE_IMG_URL}PixelArt.png?raw=true`
  },
  [ImageStyle.Risograph]: {
    desc: '高噪点、色彩错位的油印机效果',
    scenario: '独立杂志, 音乐, 艺术展, 个性品牌',
    previewUrl: `${BASE_IMG_URL}Risograph.png?raw=true`
  },
  [ImageStyle.PaperCutout]: {
    desc: '多层纸张堆叠与真实光影投射',
    scenario: '环保, ESG, 社区故事, 手作感',
    previewUrl: `${BASE_IMG_URL}PaperCutout.png?raw=true`
  },
  [ImageStyle.LofiDoodle]: {
    desc: '笔记本上的简单抖动线条简笔画',
    scenario: '个人日记, 早期构思, 生活小技巧',
    previewUrl: `${BASE_IMG_URL}LofiDoodle.png?raw=true`
  },
  [ImageStyle.Whiteboard]: {
    desc: '模拟真实白板与干擦记号笔笔迹',
    scenario: '战略规划, 教学教程, 头脑风暴, 流程图',
    previewUrl: `${BASE_IMG_URL}Whiteboard.png?raw=true`
  },
  [ImageStyle.MultiPanelManga]: {
    desc: '模拟黑白日漫的分镜布局与拟声词效果',
    scenario: '教程, 故事叙事, 产品流程, 幽默短剧',
    previewUrl: `${BASE_IMG_URL}MultiPanelManga.png?raw=true`
  },
  [ImageStyle.Glassmorphism]: {
    desc: '玻璃拟态风、半透明叠加与背景模糊效果',
    scenario: 'UI/UX设计, 科技趋势, 数字产品, 透视概念',
    previewUrl: `${BASE_IMG_URL}Glassmorphism.png?raw=true`
  },
};

export const SAMPLE_ARTICLE = `# 极简主义的无声革命

在这个信息过载的时代，**极简主义**不仅仅是一种审美选择，更是一种对内容的深度尊重。

## 核心理念
所谓极简，并非空无一物，而是恰到好处的留白。当我们将 **AI 技术** 融入创作流程时， we 发现人类创作的核心价值在于“意图”，而非“体力劳动”。AI 不再是简单的工具，而是我们想象力的延伸。

### 创作新范式
未来的创作不再是孤军奋战。通过对文章情感起伏的语义建模， AI 可以精准捕捉 those 文字难以表达的瞬间，并将其转化为具有张力的视觉符号。这比任何现成的素材库都要来得深刻。

| 维度 | 传统方式 | 极简主义 |
| :--- | :--- | :--- |
| 视觉 | 堆砌 | 留白 |
| 逻辑 | 散乱 | 凝聚 |

Imagine, 每一段文字都有它自己的视觉重力。一篇关于城市设计的文章，不再仅仅是干瘪的数据，而是辅以充满建筑美感的抽象线条。这便是逻辑与美感的终极融合。

>真正的优雅，是当所有的冗余都被剔除之后留下的力量。我们的目标是拨开迷雾，让核心观点在纯净的背景中焕发光芒。

\`\`\`javascript
const beauty = simplicity + truth;
\`\`\`
`;
