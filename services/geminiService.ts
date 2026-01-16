
import { GoogleGenAI } from "@google/genai";
import { CourseSection, Message, FileAttachment, LearningResource, PracticeQuestion, ScheduleItem } from "../types";

const DEEPTUTOR_SYSTEM_PROMPT = `You are DeepTutor, an academic document processing engine. 
PRIORITIES: Speed, Academic rigor, Progressive generation.
All outputs must be grounded in the provided document. 
Use LaTeX $$ for all math formulas.`;

const SUPPORTED_INLINE_MIMES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

class DeepTutorEngine {
  private ai: GoogleGenAI | null = null;

  private getAi() {
    if (!this.ai) {
      const key = process.env.API_KEY;
      if (!key) throw new Error("API_KEY_MISSING: No Gemini API Key found in environment.");
      this.ai = new GoogleGenAI({ apiKey: key });
    }
    return this.ai;
  }

  private isProduction() {
    return window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
  }

  /**
   * Cleans the response string from Markdown blocks
   */
  private cleanJson(text: string): any {
    try {
      const cleaned = text.replace(/```json\n?|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON Parse Error. Raw Text:", text);
      // Fallback: try to find anything that looks like a JSON array/object if parsing failed
      const startIdx = text.indexOf('[');
      const startObjIdx = text.indexOf('{');
      const realStart = (startIdx !== -1 && (startObjIdx === -1 || startIdx < startObjIdx)) ? startIdx : startObjIdx;
      if (realStart !== -1) {
        try {
          const substring = text.substring(realStart, text.lastIndexOf(text[realStart] === '[' ? ']' : '}') + 1);
          return JSON.parse(substring);
        } catch (e2) {
          throw new Error("MODEL_RESPONSE_MALFORMED: The AI returned an invalid structure.");
        }
      }
      throw new Error("MODEL_RESPONSE_MALFORMED: No valid JSON found.");
    }
  }

  private async callDirect(params: any) {
    const ai = this.getAi();
    const modelName = params.modelType === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const contents: any[] = (params.history || []).map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    const promptParts: any[] = [{ text: params.prompt }];
    
    if (params.attachment?.data) {
      const mime = params.attachment.mimeType;
      if (mime === 'text/plain' || mime === 'text/markdown' || mime === 'application/json') {
        // Use a safer base64-to-string conversion for Unicode
        const binaryString = atob(params.attachment.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const decoded = new TextDecoder().decode(bytes);
        
        promptParts[0].text = `[DOC_CONTEXT]\n${decoded}\n[/DOC_CONTEXT]\n\n${params.prompt}`;
      } else if (SUPPORTED_INLINE_MIMES.includes(mime)) {
        promptParts.push({
          inlineData: { data: params.attachment.data, mimeType: mime }
        });
      } else {
        promptParts[0].text = `[FILE_INFO: ${params.attachment.name}]\n${params.prompt}`;
      }
    }

    contents.push({ role: 'user', parts: promptParts });

    const config: any = {
      systemInstruction: params.system || DEEPTUTOR_SYSTEM_PROMPT,
      temperature: 0.1,
      tools: params.useSearch ? [{ googleSearch: {} }] : undefined,
    };

    if (params.responseType === 'json') {
      config.responseMimeType = "application/json";
    }

    // Add a 45s timeout to avoid infinite hangs
    const apiCall = ai.models.generateContent({ model: modelName, contents, config });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("GATEWAY_TIMEOUT: Gemini took too long to respond.")), 45000));

    const response: any = await Promise.race([apiCall, timeout]);
    const text = response.text || '';
    
    if (params.responseType === 'json') {
      return this.cleanJson(text);
    }
    
    return { text };
  }

  private async callProxy(payload: any) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 25000); // 25s timeout for proxy

    try {
      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(id);

      if (response.status === 404) throw new Error("PROXY_NOT_FOUND");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Cloud Proxy Failed");
      return data;
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error("GATEWAY_TIMEOUT: Serverless function timed out.");
      throw e;
    }
  }

  async generate(params: any) {
    // In preview or development, DIRECT is much more stable because Netlify Functions have a 10s limit
    if (!this.isProduction()) {
      console.log("DeepTutor: Using Direct Gateway for stability.");
      return await this.callDirect(params);
    }

    try {
      console.log("DeepTutor: Attempting Proxy Gateway...");
      return await this.callProxy(params);
    } catch (e: any) {
      if (e.message === "PROXY_NOT_FOUND" || e.message.includes("TIMEOUT")) {
        console.warn("DeepTutor: Proxy issue, falling back to Direct Gateway.");
        return await this.callDirect(params);
      }
      throw e;
    }
  }
}

const engine = new DeepTutorEngine();

export const handleAIError = (error: any): string => {
  console.error("DeepTutor Failure Stack:", error);
  const msg = error?.message || String(error);
  if (msg.includes("API_KEY_MISSING")) return "Configuration Missing: API_KEY is not defined.";
  if (msg.includes("TIMEOUT")) return "The document is too complex or the network is slow. Please try a smaller file.";
  if (msg.includes("MALFORMED")) return "Structure Protocol Error: The AI returned an unreadable response. Retrying usually fixes this.";
  return msg || "Neural Link Interrupted.";
};

export const chatWithTutor = async (history: Message[], currentSection: CourseSection, userInput: string) => {
  const prompt = `Interrogate Unit: ${currentSection.title}. 
  Content: ${currentSection.content.substring(0, 1000)}.
  JSON: { "text": "...", "isExternal": boolean, "groundingScore": number, "citations": [] }`;
  return await engine.generate({ prompt, history, modelType: 'flash', responseType: 'json' });
};

export const getDocumentStructure = async (attachment: FileAttachment) => {
  const prompt = `Analyze document "${attachment.name}". 
  Create an 8-unit curriculum. 
  JSON Array: [{"title": "Unit Name", "summary": "Goal", "sourceRange": "Reference"}]`;
  return await engine.generate({ prompt, attachment, responseType: 'json', modelType: 'flash' });
};

export const generateStage2Core = async (section: any, attachment: any) => {
  const prompt = `Synthesize THEORY for: "${section.title}".
  Return JSON: {
    "summary": "...",
    "content": "Deep theory in Markdown",
    "definitions": [{"term": "...", "definition": "..."}],
    "axioms": [{"label": "...", "expression": "LaTeX without $$"}]
  }`;
  return await engine.generate({ prompt, attachment, responseType: 'json', modelType: 'flash' });
};

export const generateStage3Logic = async (section: any, attachment: any) => {
  const prompt = `Logic Map for: "${section.title}". 
  JSON: {"mindmap": "mermaid mindmap syntax starting with 'mindmap'"}`;
  return await engine.generate({ prompt, attachment, responseType: 'json', modelType: 'flash' });
};

export const generateStage4Recall = async (section: any, attachment: any) => {
  const prompt = `Recall nodes for: "${section.title}".
  JSON: {
    "flashcards": [{"question": "...", "answer": "..."}],
    "questions": [{"question": "...", "options": ["...", "..."], "correctIndex": 0, "explanation": "..."}]
  }`;
  return await engine.generate({ prompt, attachment, responseType: 'json', modelType: 'flash' });
};

export const generateStage6Resources = async (section: any) => {
  const prompt = `Resources for: "${section.title}".
  JSON Array: [{"title": "...", "type": "video", "platform": "YouTube", "url": "...", "reason": "..."}]`;
  return await engine.generate({ prompt, modelType: 'pro', useSearch: true, responseType: 'json' });
};

export const generateMoreQuestions = async (section: CourseSection, difficulty: number): Promise<PracticeQuestion[]> => {
  const prompt = `MCQ for: ${section.title}. Difficulty ${difficulty}/5. JSON Array: [{question, options, correctIndex, explanation}]`;
  const raw = await engine.generate({ prompt, responseType: 'json', modelType: 'flash' });
  return (raw || []).map((q: any) => ({ ...q, id: crypto.randomUUID(), hasBeenAnswered: false, difficultyLevel: difficulty }));
};

export const generateStudySchedule = async (subject: string, concepts: CourseSection[]): Promise<ScheduleItem[]> => {
  const prompt = `Study plan for: ${subject}. JSON Array: [{"title": "...", "durationMinutes": 45, "focus": "..."}]`;
  return await engine.generate({ prompt, responseType: 'json', modelType: 'flash' });
};
