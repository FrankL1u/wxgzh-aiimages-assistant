
import { ArticleState } from '../types';
import { STYLES } from '../constants';

/**
 * 强化样式优先级：确保每个属性都带有 !important，这是微信排版稳定性的关键。
 */
const enforceStyle = (styleStr: string | undefined): string => {
  if (!styleStr) return '';
  return styleStr
    .split(';')
    .map(prop => {
      const p = prop.trim();
      if (!p) return '';
      if (p.toLowerCase().includes('!important')) return p + ';';
      return p + ' !important;';
    })
    .join(' ');
};

/**
 * 辅助函数：渲染 Mac 风格代码块
 */
const renderCodeBlock = (content: string, s: Record<string, string>): string => {
  const preBg = s.pre?.match(/background-color:\s*([^;!]+)/i)?.[1] || '#2d2d2d';
  const styles = Object.keys(s).reduce((acc, key) => {
    acc[key] = enforceStyle(s[key]);
    return acc;
  }, {} as Record<string, string>);

  return `
    <section style="margin: 20px 0 !important; background-color: ${preBg} !important; border-radius: 8px !important; overflow: hidden !important; display: block !important;">
      <section style="display: flex !important; padding: 12px 16px !important; gap: 8px !important; align-items: center !important;">
        <section style="width: 12px !important; height: 12px !important; border-radius: 50% !important; background-color: #ff5f56 !important;"></section>
        <section style="width: 12px !important; height: 12px !important; border-radius: 50% !important; background-color: #ffbd2e !important;"></section>
        <section style="width: 12px !important; height: 12px !important; border-radius: 50% !important; background-color: #27c93f !important;"></section>
      </section>
      <pre style="${styles.pre} margin: 0 !important; padding: 0 16px 16px 16px !important; border: none !important; border-radius: 0 !important;"><code style="${styles.code} white-space: pre-wrap !important; word-break: break-all !important;">${content}</code></pre>
    </section>
  `;
};

/**
 * 辅助函数：将缓冲的表格数据生成为微信高度兼容的标准 HTML Table
 */
const processTableBuffer = (rows: string[][], s: Record<string, string>): string => {
  if (rows.length === 0) return '';
  
  const tableStyle = enforceStyle((s.table || '') + 'width: 100%; border-collapse: collapse; margin: 20px 0; text-indent: 0 !important;');
  const thStyle = enforceStyle((s.th || '') + 'padding: 12px 15px; background-color: #f6f6f6; font-weight: bold; text-align: left; line-height: 1.5 !important;');
  const tdStyle = enforceStyle((s.td || '') + 'padding: 12px 15px; line-height: 1.5 !important;');
  const trStyle = enforceStyle(s.tr || 'border-bottom: 1px solid #eee;');

  let html = `<table style="${tableStyle}" width="100%" cellspacing="0" cellpadding="0" border="0">`;
  html += '<thead>';
  
  rows.forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      html += `<tr style="${trStyle}">`;
      row.forEach(cell => {
        html += `<th style="${thStyle}">${cell.trim()}</th>`;
      });
      html += '</tr></thead><tbody>';
    } else {
      html += `<tr style="${trStyle}">`;
      row.forEach(cell => {
        html += `<td style="${tdStyle}">${cell.trim()}</td>`;
      });
      html += '</tr>';
    }
  });

  html += '</tbody></table>';
  return html;
};

/**
 * 处理单行 Markdown（非块级元素）
 */
const parseInlineMarkdown = (text: string, s: Record<string, string>): string => {
  const t = text.trim();
  if (!t) return '';

  const styles = Object.keys(s).reduce((acc, key) => {
    acc[key] = enforceStyle(s[key]);
    return acc;
  }, {} as Record<string, string>);

  // 标题
  if (t.startsWith('# ')) return `<h1 style="${styles.h1}">${t.slice(2)}</h1>`;
  if (t.startsWith('## ')) return `<h2 style="${styles.h2}">${t.slice(3)}</h2>`;
  if (t.startsWith('### ')) return `<h3 style="${styles.h3}">${t.slice(4)}</h3>`;
  if (t.startsWith('#### ')) return `<h4 style="${styles.h4}">${t.slice(5)}</h4>`;
  if (t.startsWith('##### ')) return `<h5 style="${styles.h5}">${t.slice(6)}</h5>`;
  if (t.startsWith('###### ')) return `<h6 style="${styles.h6}">${t.slice(7)}</h6>`;

  // 引用
  if (t.startsWith('> ')) return `<blockquote style="${styles.blockquote}">${t.slice(2)}</blockquote>`;

  // 列表项预览（真正的列表在 generateArticleHtml 中处理）
  if (t.startsWith('- ') || t.startsWith('* ') || /^\d+\.\s/.test(t)) {
    const content = t.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '');
    return `<li style="${styles.li}">${content}</li>`;
  }

  // 段落及行内样式
  let formatted = t
    .replace(/\*\*(.*?)\*\*/g, `<strong style="${styles.strong}">$1</strong>`)
    .replace(/\*(.*?)\*/g, `<em style="${styles.em}">$1</em>`)
    .replace(/`(.*?)`/g, `<code style="${styles.code}">$1</code>`)
    .replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" style="${styles.a}">$1</a>`);

  return `<p style="${styles.p}">${formatted}</p>`;
};

export const generateArticleHtml = (state: ArticleState): string => {
  const selectedStyle = STYLES[state.selectedTemplate] || STYLES['wechat-default'];
  const s = selectedStyle.styles;
  
  const bgMatch = s.container.match(/background-color:\s*([^;!]+)/i) || s.container.match(/background:\s*([^;!]+)/i);
  const detectedBg = bgMatch ? bgMatch[1].trim() : '#ffffff';

  const lines = state.content.split('\n');
  let bodyHtml = '';
  let listType: 'ul' | 'ol' | null = null;
  let tableBuffer: string[][] = [];
  let codeBuffer: string[] = [];
  let isInsideCode = false;

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      bodyHtml += processTableBuffer(tableBuffer, s);
      tableBuffer = [];
    }
  };

  const flushList = () => {
    if (listType) {
      bodyHtml += `</${listType}>`;
      listType = null;
    }
  };

  const flushCode = () => {
    if (codeBuffer.length > 0) {
      bodyHtml += renderCodeBlock(codeBuffer.join('\n'), s);
      codeBuffer = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmedLine = line.trim();

    // 1. 代码块处理（最高优先级）
    if (trimmedLine.startsWith('```')) {
      if (!isInsideCode) {
        // 开始代码块
        isInsideCode = true;
        flushList();
        flushTable();
      } else {
        // 结束代码块
        isInsideCode = false;
        flushCode();
      }
      return;
    }

    if (isInsideCode) {
      codeBuffer.push(line);
      return;
    }

    // 2. 表格处理
    if (trimmedLine.startsWith('|')) {
      if (trimmedLine.includes('---')) return;
      const cells = trimmedLine.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cells.length > 0) {
        tableBuffer.push(cells);
        return;
      }
    } else {
      flushTable();
    }

    // 3. 列表处理
    const isUnordered = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ');
    const isOrdered = /^\d+\.\s/.test(trimmedLine);

    if (isUnordered) {
      if (listType !== 'ul') {
        flushList();
        bodyHtml += `<ul style="${enforceStyle(s.ul)}">`;
        listType = 'ul';
      }
    } else if (isOrdered) {
      if (listType !== 'ol') {
        flushList();
        bodyHtml += `<ol style="${enforceStyle(s.ol)}">`;
        listType = 'ol';
      }
    } else if (trimmedLine) {
      flushList();
    }

    // 4. 普通行渲染
    if (trimmedLine) {
      bodyHtml += parseInlineMarkdown(trimmedLine, s);
    } else {
      flushList();
    }
    
    // 5. 图片插入
    const img = state.images.find(image => image.index === i);
    if (img) {
      flushList();
      flushTable();
      bodyHtml += `
        <section style="margin: 30px 0 !important; text-align: center !important; line-height: 0 !important; display: block !important;">
          <img src="${img.url}" style="${enforceStyle(s.img)} display: inline-block !important;" />
        </section>
      `;
    }
  });

  flushList();
  flushTable();
  flushCode();

  const coverUrl = state.covers[state.selectedCoverIndex]?.url || '';

  return `
    <section style="background-color: ${detectedBg} !important; padding: 30px 0 !important; display: block !important; margin: 0 !important;">
      <section style="${enforceStyle(s.container)} background-color: ${detectedBg} !important; display: block !important; box-sizing: border-box !important; margin: 0 auto !important; position: relative !important;">
        <section style="box-sizing: border-box !important; width: 100% !important; display: block !important; overflow: hidden !important; padding: 1px 0 !important;">
          ${coverUrl ? `
          <section style="margin: 0 0 45px 0 !important; text-align: center !important; line-height: 0 !important; display: block !important;">
            <img src="${coverUrl}" style="${enforceStyle(s.img)}" />
          </section>` : ''}
          <section class="rich_media_content" style="box-sizing: border-box !important; clear: both !important; min-height: 1em !important;">
            ${bodyHtml}
          </section>
          <section style="margin-top: 100px !important; text-align: center !important; padding-bottom: 20px !important;">
            <section style="display: block !important; margin-bottom: 15px !important;">
              <section style="display: inline-block !important; width: 50px !important; height: 1px !important; background-color: #ddd !important; vertical-align: middle !important;"></section>
              <section style="display: inline-block !important; margin: 0 15px !important; font-size: 10px !important; letter-spacing: 4px !important; color: #ccc !important; vertical-align: middle !important; font-weight: bold !important;">THE END</section>
              <section style="display: inline-block !important; width: 50px !important; height: 1px !important; background-color: #ddd !important; vertical-align: middle !important;"></section>
            </section>
            <p style="font-size: 11px !important; color: #bbb !important; margin: 0 !important; letter-spacing: 1px !important;">Powerd by Smart Layout Assistant</p>
          </section>
        </section>
      </section>
    </section>
  `.trim();
};
