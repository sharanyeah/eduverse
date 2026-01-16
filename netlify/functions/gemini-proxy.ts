
import { GoogleGenAI } from "@google/genai";

const DEEPTUTOR_SYSTEM_PROMPT = `You are DeepTutor, an academic document processing engine. 
PRIORITIES: Speed, Academic rigor, Progressive generation.
All outputs must be grounded in the provided document. 
Use LaTeX $$ for all math formulas.`;

const SUPPORTED_INLINE_MIMES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API_KEY is not configured on the server." }) };
  }

  try {
    const { prompt, attachment, history, modelType, responseType, useSearch, system } = JSON.parse(event.body);
    
    const ai = new GoogleGenAI({ apiKey });
    const modelName = modelType === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const contents: any[] = (history || []).map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    const promptParts: any[] = [{ text: prompt }];
    
    if (attachment?.data) {
      const mime = attachment.mimeType;
      // Handle text-based files by embedding content directly in prompt
      if (mime === 'text/plain' || mime === 'text/markdown' || mime === 'application/json') {
        const decoded = Buffer.from(attachment.data, 'base64').toString('utf-8');
        promptParts[0].text = `[DOCUMENT CONTEXT START]\n${decoded}\n[DOCUMENT CONTEXT END]\n\n${prompt}`;
      } else if (SUPPORTED_INLINE_MIMES.includes(mime)) {
        promptParts.push({
          inlineData: {
            data: attachment.data,
            mimeType: mime
          }
        });
      } else {
        // Fallback for unsupported types like PPT - we don't send binary to avoid 400 errors
        promptParts[0].text = `[WARNING: Unsupported Binary File: ${attachment.name}]\n${prompt}`;
      }
    }

    contents.push({ role: 'user', parts: promptParts });

    const config: any = {
      systemInstruction: system || DEEPTUTOR_SYSTEM_PROMPT,
      temperature: 0.1,
      tools: useSearch ? [{ googleSearch: {} }] : undefined,
    };

    if (responseType === 'json') {
      config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config
    });

    const text = response.text || '';
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: text // Netlify function will stringify correctly
    };

  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message || "Internal AI Processing Error" }) 
    };
  }
};
