
import { GoogleGenAI, Type } from "@google/genai";
import { ImageStyle, ImagePrompt } from "../types";
import { STYLE_PROMPT_MAP } from "../constants";

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async analyzeContent(title: string, content: string, count: number, strategy: 'AI' | 'Fixed' = 'AI'): Promise<ImagePrompt[]> {
    const ai = this.getAI();
    
    // --- 构建带原始行号的元数据 ---
    const rawLines = content.split('\n');
    const paragraphMeta: { index: number; originalIndex: number; text: string; length: number; startChar: number }[] = [];
    
    let cumulativeChars = 0;
    rawLines.forEach((line, originalIndex) => {
      const text = line.trim();
      if (text.length > 0) {
        paragraphMeta.push({
          index: paragraphMeta.length, // 逻辑索引 (0, 1, 2...)
          originalIndex: originalIndex, // 物理索引 (行号)
          text: text,
          length: text.length,
          startChar: cumulativeChars
        });
        cumulativeChars += text.length;
      }
    });

    const totalParagraphs = paragraphMeta.length;
    // 移除字符总数依赖，改用段落总数作为基准
    // const totalChars = cumulativeChars; 

    // 如果策略是 Fixed（手动）或者段落太少，直接均匀分布
    if (strategy === 'Fixed' || totalParagraphs <= count) {
      return this.generateFixedDistribution(paragraphMeta, count, title);
    }

    const modelName = 'gemini-3-pro-preview';
    
    // 计算基于段落数量的步进
    const prompt = `
      任务：为微信公众号文章进行绝对均匀的配图规划。
      
      【文章硬性指标】：
      - 标题：${title}
      - 必须配图数量：${count} 张
      - 总有效段落数：${totalParagraphs}
      
      【强制分布规则】：
      文章已被划分为 ${count} 个等分区域（基于段落数量）。
      请特别注意：必须确保最后一张图片分布在文章的最后 3 个段落内。
      
      【段落流数据】:
      ${paragraphMeta.map(m => `[ID:${m.index} | 进度:${Math.round(((m.index + 1) / totalParagraphs) * 100)}%] ${m.text.substring(0, 30)}...`).join('\n')}

      请返回 ${count} 个 JSON 对象，包含：
      - index (段落ID)
      - suggestedPrompt (英文)
      - reason
    `;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 16000 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.INTEGER },
                suggestedPrompt: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["index", "suggestedPrompt", "reason"]
            }
          }
        }
      });

      let aiPrompts: any[] = JSON.parse(response.text);
      
      // --- 核心算法：基于段落数量的强制分区 (Paragraph-Based Zone Filling) ---
      // 解决字数密度不均导致的视觉偏差问题
      
      const result: ImagePrompt[] = [];
      const paragraphZoneSize = totalParagraphs / count; // 每个区间包含多少个段落

      for (let i = 0; i < count; i++) {
        // 定义当前区间的逻辑段落范围
        const zoneStartIdx = i * paragraphZoneSize;
        const zoneEndIdx = (i + 1) * paragraphZoneSize;
        
        // 1. 尝试在 AI 建议中找落在该 ID 范围内的
        const candidatesInZone = aiPrompts.filter(p => {
          if (i === count - 1) return p.index >= zoneStartIdx;
          return p.index >= zoneStartIdx && p.index < zoneEndIdx;
        });

        let selectedMeta;
        let selectedPrompt = "";
        let selectedReason = "";

        if (candidatesInZone.length > 0) {
          // A. 命中
          const best = candidatesInZone[0]; 
          // 安全检查，防止 AI 返回不存在的 index
          selectedMeta = paragraphMeta[best.index] || paragraphMeta[Math.floor(zoneStartIdx)];
          selectedPrompt = best.suggestedPrompt;
          selectedReason = best.reason;
        } else {
          // B. 未命中 (Fallback)：计算该区间的几何中心段落
          let targetIndex = Math.floor(zoneStartIdx + (paragraphZoneSize * 0.5));
          
          // 如果是最后一张，强制推向最后一段
          if (i === count - 1) {
            targetIndex = totalParagraphs - 1;
            selectedReason = "强制尾部填充";
          } else {
            // 加上 0.5 的偏移量，让图片在视觉上更倾向于段落后方
            targetIndex = Math.min(targetIndex + 1, totalParagraphs - 1);
            selectedReason = `系统分区自动填充：第 ${i+1} 区间`;
          }

          selectedMeta = paragraphMeta[targetIndex];
          selectedPrompt = `Cinematic editorial visual for "${title}", abstract concept representation.`;
        }

        // 3. 结果去重与顺序保护
        if (result.length > 0) {
           const prevImg = result[result.length - 1];
           // 反查上一张图的 logical index
           const prevLogicalIndex = paragraphMeta.find(m => m.originalIndex === prevImg.index)?.index || 0;
           
           if (selectedMeta.index <= prevLogicalIndex) {
             const nextIndex = Math.min(prevLogicalIndex + 1, totalParagraphs - 1);
             selectedMeta = paragraphMeta[nextIndex];
           }
        }

        result.push({
          index: selectedMeta.originalIndex,
          paragraphText: selectedMeta.text.substring(0, 20) + "...",
          suggestedPrompt: selectedPrompt,
          reason: selectedReason
        });
      }

      return result;

    } catch (e) {
      console.error("AI Analysis failed, falling back to fixed distribution", e);
      return this.generateFixedDistribution(paragraphMeta, count, title);
    }
  }

  private static generateFixedDistribution(paragraphMeta: any[], count: number, title: string): ImagePrompt[] {
    const result: ImagePrompt[] = [];
    
    for (let i = 0; i < count; i++) {
      let targetIndex = Math.floor(paragraphMeta.length * (i / count));
      
      if (i > 0 && paragraphMeta.length > count) targetIndex += 1; 
      if (i === count - 1) targetIndex = paragraphMeta.length - 1;

      targetIndex = Math.min(targetIndex, paragraphMeta.length - 1);
      
      if (result.length > 0) {
        const prevRes = result[result.length - 1];
        const prevLogicalIndex = paragraphMeta.find((m: any) => m.originalIndex === prevRes.index)?.index || 0;
        
        if (targetIndex <= prevLogicalIndex) {
            targetIndex = Math.min(prevLogicalIndex + 1, paragraphMeta.length - 1);
        }
      }

      const meta = paragraphMeta[targetIndex];
      result.push({
        index: meta.originalIndex,
        paragraphText: meta.text.substring(0, 20),
        suggestedPrompt: `Minimalist visualization for "${title}" section ${i+1}`,
        reason: "Fixed spacing strategy"
      });
    }
    return result;
  }

  static async generateImage(prompt: string, style: ImageStyle, customStylePrompt: string = "", aspectRatio: string = "16:9"): Promise<string> {
    const ai = this.getAI();
    const styleDescription = style === ImageStyle.Custom ? customStylePrompt : STYLE_PROMPT_MAP[style];
    const fullPrompt = `${prompt}. ${styleDescription}. CRITICAL: Any text MUST be in Chinese. NO ENGLISH. Cinematic photography, 8k.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: fullPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Image generation failed");
  }

  static async generateCovers(title: string, style: ImageStyle, customStylePrompt: string = ""): Promise<string[]> {
    const coverPrompt = `Grand cinematic cover art for "${title}". Visual metaphor, 16:9. Chinese text if applicable.`;
    const url = await this.generateImage(coverPrompt, style, customStylePrompt, "16:9");
    return [url];
  }
}
