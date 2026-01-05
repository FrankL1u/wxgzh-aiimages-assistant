
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ImageStyle, 
  LayoutTemplate, 
  ImageStrategy, 
  ArticleState, 
  GeneratedImage, 
  GeneratedCover 
} from './types';
import { GeminiService } from './services/geminiService';
import { SAMPLE_ARTICLE, STYLES, STYLE_PROMPT_MAP, STYLE_METADATA } from './constants';
import { generateArticleHtml } from './utils/htmlGenerator';

const Spinner = ({ className = "h-4 w-4 text-white" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// 图片操作工具栏组件
const ImageActions: React.FC<{
  onPreview: () => void;
  onRegenerate: () => void;
  onEdit: () => void;
  isRegenerating: boolean;
}> = ({ onPreview, onRegenerate, onEdit, isRegenerating }) => (
  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
    <button onClick={(e) => { e.stopPropagation(); onPreview(); }} title="预览大图" className="w-8 h-8 bg-black/80 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
    </button>
    <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} disabled={isRegenerating} title="按原文风格重绘" className="w-8 h-8 bg-black/80 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50">
      {isRegenerating ? <Spinner className="w-3 h-3" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
    </button>
    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="自定义提示词重绘" className="w-8 h-8 bg-black/80 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
    </button>
  </div>
);

// 大图预览弹窗
const ImageLightbox: React.FC<{ url: string; isOpen: boolean; onClose: () => void }> = ({ url, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors" onClick={onClose}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <img src={url} className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()} />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-[10px] uppercase tracking-[0.3em]">
        右键可直接另存为高清图片
      </div>
    </div>
  );
};

// 自定义提示词弹窗
const CustomPromptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialPrompt: string;
  onConfirm: (prompt: string) => void;
  isProcessing: boolean;
}> = ({ isOpen, onClose, initialPrompt, onConfirm, isProcessing }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  useEffect(() => { setPrompt(initialPrompt); }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">自定义提示词生成</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">请输入英文绘图提示词，AI 将结合当前排版风格重新生成该位置的图片（含文字请注明使用中文）：</p>
          <textarea 
            className="w-full h-32 p-4 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors resize-none font-mono"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A futuristic landscape with floating islands, cinematic lighting, with Chinese text '未来'..."
          />
        </div>
        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">取消</button>
          <button 
            disabled={isProcessing || !prompt.trim()}
            onClick={() => onConfirm(prompt)}
            className="px-8 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            {isProcessing ? <Spinner className="w-3 h-3" /> : '开始重绘'}
          </button>
        </div>
      </div>
    </div>
  );
};

const htmlToMarkdown = (html: string): string => {
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n');
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');
  md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n');
  md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<br[^>]*>/gi, '\n');
  md = md.replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<table[^>]*>(.*?)<\/table>/gis, (match, tableBody) => {
    const rows = tableBody.match(/<tr[^>]*>(.*?)<\/tr>/gis) || [];
    let tableMd = '\n';
    rows.forEach((row: string, i: number) => {
      const cells = row.match(/<(td|th)[^>]*>(.*?)<\/\1>/gis) || [];
      const cellTexts = cells.map((c: string) => c.replace(/<[^>]+>/g, '').trim());
      tableMd += `| ${cellTexts.join(' | ')} |\n`;
      if (i === 0) { tableMd += `| ${cellTexts.map(() => '---').join(' | ')} |\n`; }
    });
    return tableMd + '\n';
  });
  md = md.replace(/<[^>]+>/g, '');
  const doc = new DOMParser().parseFromString(md, 'text/html');
  return doc.documentElement.textContent || md;
};

const StylePreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentStyle: ImageStyle;
  onSelect: (style: ImageStyle) => void;
}> = ({ isOpen, onClose, currentStyle, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md transition-all animate-in fade-in">
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] overflow-hidden shadow-2xl transition-all scale-in flex flex-col rounded-sm">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-black">全量配图风格画廊</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Select your visual language</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-8 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(STYLE_METADATA).map(([key, metadata]) => (
              <div 
                key={key}
                onClick={() => {
                  onSelect(key as ImageStyle);
                  onClose();
                }}
                className={`group cursor-pointer bg-white overflow-hidden border-2 transition-all hover:shadow-xl ${
                  currentStyle === key ? 'border-black' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="aspect-video relative overflow-hidden bg-gray-100">
                  <img 
                    src={metadata.previewUrl} 
                    alt={key} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  {currentStyle === key && (
                    <div className="absolute top-2 right-2 bg-black text-white p-1 rounded-full shadow-lg">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h4 className="text-xs font-black uppercase tracking-wider mb-1">{key}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-1 mb-3">{metadata.desc}</p>
                  <div className="pt-3 border-t border-gray-50">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-gray-300">适用：</span>
                    <span className="text-[9px] font-medium text-gray-400">{metadata.scenario}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 bg-white border-t border-gray-100 flex justify-end">
           <button 
            onClick={onClose}
            className="px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.3em] font-black hover:bg-gray-800 transition-colors"
          >
            返回排版
          </button>
        </div>
      </div>
    </div>
  );
};

// 预览块渲染引擎
const ArticlePreview: React.FC<{ 
  state: ArticleState; 
  currentStyle: any;
  onPreviewImage: (url: string) => void;
  onRegenerateImage: (id: string, customPrompt?: string) => Promise<void>;
  onEditImage: (image: GeneratedImage) => void;
  regeneratingId: string | null;
}> = ({ state, currentStyle, onPreviewImage, onRegenerateImage, onEditImage, regeneratingId }) => {
  const lines = state.content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[][] = [];
  let codeBuffer: string[] = [];
  let isInsideCode = false;

  const flushTable = (key: number) => {
    if (tableBuffer.length === 0) return null;
    const rows = [...tableBuffer];
    tableBuffer = [];
    
    return (
      <div key={`table-${key}`} className="my-6 overflow-x-auto">
        <table style={{ ...parseStyleString(currentStyle.table), textIndent: 0, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={parseStyleString(currentStyle.tr)}>
              {rows[0].map((cell, idx) => (
                <th key={idx} style={{ ...parseStyleString(currentStyle.th), textAlign: 'left', padding: '12px' }}>{cell.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rIdx) => (
              <tr key={rIdx} style={parseStyleString(currentStyle.tr)}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ ...parseStyleString(currentStyle.td), padding: '12px' }}>{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const flushCode = (key: number) => {
    if (codeBuffer.length === 0) return null;
    const content = codeBuffer.join('\n');
    codeBuffer = [];
    const preBg = currentStyle.pre?.match(/background-color:\s*([^;!]+)/i)?.[1] || '#2d2d2d';
    
    return (
      <div key={`code-${key}`} className="my-6 rounded-lg overflow-hidden shadow-sm" style={{ backgroundColor: preBg }}>
        <div className="flex gap-2 p-3">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <pre style={{ ...parseStyleString(currentStyle.pre), margin: 0, padding: '0 16px 16px 16px', border: 'none' }}>
          <code style={{ ...parseStyleString(currentStyle.code), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{content}</code>
        </pre>
      </div>
    );
  };

  const renderSinglePart = (t: string, key: number) => {
    const s = currentStyle;
    if (t.startsWith('# ')) return <h1 key={key} style={parseStyleString(s.h1)}>{t.slice(2)}</h1>;
    if (t.startsWith('## ')) return <h2 key={key} style={parseStyleString(s.h2)}>{t.slice(3)}</h2>;
    if (t.startsWith('### ')) return <h3 key={key} style={parseStyleString(s.h3)}>{t.slice(4)}</h3>;
    if (t.startsWith('#### ')) return <h4 key={key} style={parseStyleString(s.h4)}>{t.slice(5)}</h4>;
    if (t.startsWith('> ')) return <blockquote key={key} style={parseStyleString(s.blockquote)}>{t.slice(2)}</blockquote>;
    if (t.startsWith('- ') || t.startsWith('* ')) return <li key={key} style={parseStyleString(s.li)}>{t.slice(2)}</li>;
    
    let formatted = t
      .replace(/\*\*(.*?)\*\*/g, `<strong style="${s.strong || ''}">$1</strong>`)
      .replace(/\*(.*?)\*/g, `<em style="${s.em || ''}">$1</em>`)
      .replace(/`(.*?)`/g, `<code style="${s.code || ''}">$1</code>`)
      .replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" style="${s.a || ''}">$1</a>`);

    return <p key={key} style={parseStyleString(s.p)} dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('```')) {
      if (!isInsideCode) {
        isInsideCode = true;
      } else {
        isInsideCode = false;
        elements.push(flushCode(i));
      }
      return;
    }

    if (isInsideCode) {
      codeBuffer.push(line);
      return;
    }

    if (trimmed.startsWith('|')) {
      if (!trimmed.includes('---')) {
        const cells = trimmed.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length > 0) tableBuffer.push(cells);
      }
      return;
    } else if (tableBuffer.length > 0) {
      elements.push(flushTable(i));
    }

    if (trimmed) {
      elements.push(renderSinglePart(trimmed, i));
    }

    const img = state.images.find(im => im.index === i);
    if (img) {
      elements.push(
        <div key={`img-${i}`} className="my-10 text-center relative group">
          <div className="inline-block relative overflow-hidden">
            <img 
              src={img.url} 
              style={parseStyleString(currentStyle.img)} 
              alt={`Illustration ${i}`} 
              className={`inline-block transition-all duration-700 ${regeneratingId === img.id ? 'opacity-40 blur-sm scale-95' : 'group-hover:scale-105'}`} 
            />
            {regeneratingId === img.id && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner className="w-8 h-8 text-black" />
              </div>
            )}
            <ImageActions 
              onPreview={() => onPreviewImage(img.url)}
              onRegenerate={() => onRegenerateImage(img.id)}
              onEdit={() => onEditImage(img)}
              isRegenerating={regeneratingId === img.id}
            />
          </div>
        </div>
      );
    }
  });

  if (tableBuffer.length > 0) elements.push(flushTable(lines.length));
  if (codeBuffer.length > 0) elements.push(flushCode(lines.length));

  return <>{elements}</>;
};

const App: React.FC = () => {
  const [state, setState] = useState<ArticleState>({
    title: '',
    content: '',
    imageCount: 4,
    imageStyle: ImageStyle.ModernTech3D,
    customStylePrompt: '',
    imageStrategy: ImageStrategy.AI,
    images: [],
    covers: [],
    selectedCoverIndex: 0,
    selectedTemplate: LayoutTemplate.WechatDefault,
    isAnalyzing: false,
    statusMessage: ''
  });

  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customPromptData, setCustomPromptData] = useState<{ id: string; initialPrompt: string; type: 'image' | 'cover' } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
    };
    checkKey();
  }, []);

  const handlePaste = (e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      const markdown = htmlToMarkdown(html);
      setState(prev => ({ ...prev, content: markdown }));
    }
  };

  const handleStartAnalysis = async () => {
    if (!state.title || !state.content) {
      alert("请填写文章标题和内容。");
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, statusMessage: '语义深度分析中...' }));
    
    try {
      const strategy = state.imageStrategy === ImageStrategy.AI ? 'AI' : 'Fixed';
      const prompts = await GeminiService.analyzeContent(state.title, state.content, state.imageCount, strategy);
      const actualCount = prompts.length;
      
      setState(prev => ({ ...prev, statusMessage: '生成艺术封面...' }));
      const coverUrls = await GeminiService.generateCovers(state.title, state.imageStyle, state.customStylePrompt);
      const newCovers: GeneratedCover[] = coverUrls.map((url, i) => ({ id: `cover-${i}`, url, style: 'default' }));
      
      setState(prev => ({ ...prev, statusMessage: '绘制视觉插图...' }));
      const images: GeneratedImage[] = [];
      for (let i = 0; i < actualCount; i++) {
        setState(prev => ({ ...prev, statusMessage: `雕琢插图 ${i + 1}/${actualCount}...` }));
        const url = await GeminiService.generateImage(prompts[i].suggestedPrompt, state.imageStyle, state.customStylePrompt);
        images.push({
          id: `img-${i}`,
          index: prompts[i].index,
          url,
          prompt: prompts[i].suggestedPrompt
        });
      }

      setState(prev => ({
        ...prev,
        images,
        covers: newCovers,
        selectedCoverIndex: 0,
        isAnalyzing: false,
        statusMessage: '准备就绪'
      }));
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      setState(prev => ({ ...prev, isAnalyzing: false, statusMessage: '生成失败，请重试。' }));
    }
  };

  // 单图重绘逻辑
  const handleRegenerateImage = async (id: string, customPrompt?: string) => {
    if (regeneratingId) return;
    setRegeneratingId(id);
    try {
      if (id.startsWith('cover-')) {
        const coverIdx = parseInt(id.split('-')[1]);
        const targetPrompt = customPrompt || `Epic cinematic visual metaphor for article titled "${state.title}". Use Chinese text if needed.`;
        const url = await GeminiService.generateImage(targetPrompt, state.imageStyle, state.customStylePrompt);
        setState(prev => {
          const newCovers = [...prev.covers];
          newCovers[coverIdx] = { ...newCovers[coverIdx], url };
          return { ...prev, covers: newCovers };
        });
      } else {
        const imgIdx = state.images.findIndex(img => img.id === id);
        const img = state.images[imgIdx];
        const targetPrompt = customPrompt || img.prompt;
        const url = await GeminiService.generateImage(targetPrompt, state.imageStyle, state.customStylePrompt);
        setState(prev => {
          const newImages = [...prev.images];
          newImages[imgIdx] = { ...newImages[imgIdx], url, prompt: targetPrompt };
          return { ...prev, images: newImages };
        });
      }
      setCustomPromptData(null);
    } catch (error) {
      alert("重新生成失败，请检查网络或 API Key。");
    } finally {
      setRegeneratingId(null);
    }
  };

  const copyToClipboard = async () => {
    const html = generateArticleHtml(state);
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const plainBlob = new Blob([state.content], { type: 'text/plain' });
      const item = new ClipboardItem({ 'text/html': blob, 'text/plain': plainBlob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
      try {
        await navigator.clipboard.writeText(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) { alert("复制失败，请尝试手动复制。"); }
    }
  };

  const handleSample = () => {
    setState(prev => ({ ...prev, title: '极简主义的无声革命', content: SAMPLE_ARTICLE }));
  };

  const currentStyle = STYLES[state.selectedTemplate]?.styles || STYLES['wechat-default'].styles;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white selection:bg-black selection:text-white font-sans text-black">
      <StylePreviewModal 
        isOpen={isStyleModalOpen} 
        onClose={() => setIsStyleModalOpen(false)} 
        currentStyle={state.imageStyle} 
        onSelect={(style) => setState(prev => ({ ...prev, imageStyle: style }))}
      />
      
      <ImageLightbox 
        url={previewUrl || ''} 
        isOpen={!!previewUrl} 
        onClose={() => setPreviewUrl(null)} 
      />

      <CustomPromptModal 
        isOpen={!!customPromptData}
        onClose={() => setCustomPromptData(null)}
        initialPrompt={customPromptData?.initialPrompt || ''}
        isProcessing={!!regeneratingId}
        onConfirm={(p) => customPromptData && handleRegenerateImage(customPromptData.id, p)}
      />

      <div className="w-[35%] flex flex-col border-r border-brand-border h-full bg-white z-10 shadow-2xl relative">
        <div className="flex-grow overflow-y-auto scrollbar-hide flex flex-col">
          <div className="px-10 pt-12 pb-8 flex-shrink-0">
            <div className="flex items-center space-x-3 mb-10">
              <div className="w-5 h-5 bg-black rounded-full"></div>
              <h1 className="text-[11px] uppercase tracking-[0.4em] font-black">公众号智能配图</h1>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">文章标题</label>
                <input
                  type="text"
                  className="w-full bg-white text-black text-2xl font-bold border border-brand-border px-5 py-4 focus:border-black focus:outline-none transition-all placeholder-gray-200"
                  placeholder="在此输入标题"
                  value={state.title}
                  onChange={(e) => setState(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-col px-10 pb-10">
            <div className="relative flex-grow mb-8 flex flex-col min-h-[250px]">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">正文内容</label>
              <div className="flex-grow bg-white border border-brand-border overflow-hidden focus-within:border-black transition-colors">
                <textarea
                  className="w-full h-full bg-transparent text-black text-[15px] font-sans leading-relaxed p-7 focus:outline-none resize-none"
                  placeholder="粘贴内容，支持 Markdown..."
                  value={state.content}
                  onPaste={handlePaste}
                  onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              {state.content.length === 0 && (
                <button onClick={handleSample} className="absolute top-12 right-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300 hover:text-black transition-colors z-10">
                  加载样例文本
                </button>
              )}
            </div>

            <div className="space-y-6 pt-8 border-t border-brand-border bg-white pb-36">
              <div className="grid grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">配图风格</label>
                     <button 
                        onClick={() => setIsStyleModalOpen(true)}
                        className="text-[9px] uppercase tracking-widest font-black text-black/60 hover:text-black transition-colors border border-black/10 px-2 py-0.5 rounded shadow-sm flex items-center gap-1"
                      >
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                        风格预览
                      </button>
                   </div>
                   <select
                    className="w-full bg-transparent border-b-2 border-brand font-black focus:outline-none cursor-pointer py-1"
                    value={state.imageStyle}
                    onChange={(e) => setState(prev => ({ ...prev, imageStyle: e.target.value as ImageStyle }))}
                  >
                    {Object.values(ImageStyle).map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">配图策略</label>
                  <select
                    className="w-full bg-transparent border-b-2 border-brand font-black focus:outline-none cursor-pointer py-1"
                    value={state.imageStrategy}
                    onChange={(e) => setState(prev => ({ ...prev, imageStrategy: e.target.value as ImageStrategy }))}
                  >
                    {Object.values(ImageStrategy).map(strategy => (
                      <option key={strategy} value={strategy}>{strategy}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400">配图数量 ({state.imageCount})</label>
                <input
                  type="range" min="1" max="6"
                  className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  value={state.imageCount}
                  onChange={(e) => setState(prev => ({ ...prev, imageCount: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-28 bg-white/95 backdrop-blur-3xl border-t border-brand-border flex items-center justify-center px-10 z-30 shadow-2xl">
          <button
            onClick={handleStartAnalysis}
            disabled={state.isAnalyzing}
            className={`w-full py-5 text-[11px] uppercase tracking-[0.6em] font-black transition-all border-2 ${
              state.isAnalyzing ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-black border-black text-white hover:bg-white hover:text-black shadow-xl'
            }`}
          >
            {state.isAnalyzing ? (
              <span className="flex items-center justify-center">
                 <Spinner /> <span className="ml-3">{state.statusMessage}</span>
              </span>
            ) : '一键 AI 智能排版'}
          </button>
        </div>
      </div>

      <div className="w-[65%] flex flex-col bg-[#F5F5F7] relative">
        <div className="flex flex-col bg-white border-b border-brand-border flex-shrink-0 z-20">
          <div className="h-16 flex items-center justify-between px-12">
            <h2 className="text-[11px] uppercase tracking-[0.4em] font-black border-b-2 border-black h-full flex items-center">文章内容预览</h2>
            <div className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-300">Layout Preview</div>
          </div>
          <div className="px-12 py-4 bg-gray-50/50 overflow-x-auto scrollbar-hide border-t border-gray-100">
             <div className="flex flex-nowrap gap-3 items-center min-w-max pb-1">
              {Object.keys(STYLES).map(key => (
                <button key={key} onClick={() => setState(prev => ({ ...prev, selectedTemplate: key as LayoutTemplate }))} className={`text-[10px] px-4 py-2 uppercase tracking-widest font-bold transition-all border rounded-full whitespace-nowrap ${state.selectedTemplate === key ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}>{STYLES[key].name}</button>
              ))}
             </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-12 flex flex-col items-center bg-[#EDEDED] pattern-dots scrollbar-hide relative" ref={scrollRef}>
          {state.isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full space-y-8 opacity-20">
               <div className="w-16 h-16 border-[1px] border-black/10 border-t-black rounded-full animate-spin"></div>
               <p className="text-[12px] uppercase tracking-[0.5em] font-black text-black">{state.statusMessage}</p>
            </div>
          ) : (
            <div className="relative w-full max-w-[750px] mb-24">
              <div className="w-full bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.18)] min-h-screen transition-all duration-500 overflow-hidden rounded-sm relative">
                <div style={{ ...parseStyleString(currentStyle.container || ''), minHeight: '100vh' }}>
                  {state.covers.length > 0 && (
                    <div className="my-10 flex gap-4 items-start">
                      <div className="w-full relative group cursor-pointer border border-gray-50">
                        <img 
                          src={state.covers[0].url} 
                          style={parseStyleString(currentStyle.img || '')} 
                          alt="Cover" 
                          className={`transition-all duration-700 ${regeneratingId === state.covers[0].id ? 'opacity-40 blur-sm scale-95' : 'group-hover:scale-[1.01]'}`}
                        />
                        {regeneratingId === state.covers[0].id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Spinner className="w-10 h-10 text-black" />
                          </div>
                        )}
                        <ImageActions 
                          onPreview={() => setPreviewUrl(state.covers[0].url)}
                          onRegenerate={() => handleRegenerateImage(state.covers[0].id)}
                          onEdit={() => setCustomPromptData({ 
                            id: state.covers[0].id, 
                            initialPrompt: `Cover for article: ${state.title}. (Must contain Chinese if text is added)`,
                            type: 'cover'
                          })}
                          isRegenerating={regeneratingId === state.covers[0].id}
                        />
                      </div>
                    </div>
                  )}

                  <div className="article-content">
                    <ArticlePreview 
                      state={state} 
                      currentStyle={currentStyle} 
                      onPreviewImage={setPreviewUrl}
                      onRegenerateImage={handleRegenerateImage}
                      onEditImage={(img) => setCustomPromptData({ id: img.id, initialPrompt: img.prompt, type: 'image' })}
                      regeneratingId={regeneratingId}
                    />
                  </div>
                  
                  <div className="mt-24 pt-12 border-t border-gray-100 text-center pb-8">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <div className="h-[1px] w-8 bg-gray-200"></div>
                      <p className="text-[10px] tracking-[0.5em] font-black uppercase text-gray-300">End of Preview</p>
                      <div className="h-[1px] w-8 bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-28 bg-white/95 backdrop-blur-3xl border-t border-brand-border flex items-center justify-center space-x-10 px-16 flex-shrink-0 z-30 sticky bottom-0 shadow-2xl">
          <button onClick={copyToClipboard} className={`px-24 py-4 text-[11px] uppercase tracking-[0.5em] font-black transition-all ${copied ? 'bg-black text-white' : 'bg-black text-white hover:bg-gray-800 shadow-xl'}`}>
            {copied ? '已复制至剪贴板 ✓' : '复制富文本内容'}
          </button>
        </div>
      </div>
      
      <style>{`
        .pattern-dots { background-image: radial-gradient(#ccc 1px, transparent 1px); background-size: 24px 24px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .article-content em { font-style: italic; opacity: 0.9; }
        .article-content strong { font-weight: bold; }
        .article-content table { text-indent: 0 !important; border-collapse: collapse !important; }
        .article-content td, .article-content th { border: 1px solid #eee !important; }
        .article-content pre { overflow-x: auto !important; }
        .scale-in { animation: scale-in 0.2s ease-out; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

function parseStyleString(styleStr: string | undefined): React.CSSProperties {
  if (!styleStr) return {};
  const styleObj: Record<string, string> = {};
  styleStr.split(';').forEach(pair => {
    const [key, value] = pair.split(':');
    if (key && value) {
      const camelKey = key.trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      styleObj[camelKey] = value.trim().replace(' !important', '');
    }
  });
  return styleObj as React.CSSProperties;
}

export default App;
