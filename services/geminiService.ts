
import { CourseSection, Message, FileAttachment, LearningResource, PracticeQuestion, ScheduleItem } from "../types";

class GeminiProxyClient {
  private async callProxy(payload: any) {
    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Proxy Error: ${response.statusText}`);
    }

    return await response.json();
  }

  async generate(params: {
    prompt: string;
    attachment?: FileAttachment;
    history?: Message[];
    modelType?: 'flash' | 'pro';
    responseType?: 'json' | 'text';
    useSearch?: boolean;
    system?: string;
  }) {
    return await this.callProxy({
      ...params,
      modelType: params.modelType || 'flash',
      responseType: params.responseType || 'json'
    });
  }
}

const client = new GeminiProxyClient();

export const handleAIError = (error: any): string => {
  console.error("DeepTutor Error:", error);
  const msg = error?.message || String(error);
  if (msg.includes("Unsupported MIME type")) return "The current file format is not supported for direct visual analysis. DeepTutor is attempting text-only extraction.";
  if (msg.includes("404") || msg.includes("not found")) return "Neural gateway not found. Ensure Netlify Functions are deployed.";
  return "DeepTutor Engine Interrupted. Retrying progressive sync...";
};

export const chatWithTutor = async (history: Message[], currentSection: CourseSection, userInput: string) => {
  const prompt = `Answer based on: ${currentSection.title}. 
  Context: ${currentSection.content.substring(0, 1500)}.
  JSON: { "text": "...", "isExternal": boolean, "groundingScore": number, "citations": [] }`;
  
  return await client.generate({ prompt, history, modelType: 'flash', responseType: 'json' });
};

export const getDocumentStructure = async (attachment: FileAttachment) => {
  const prompt = `STAGE 1 — INSTANT STRUCTURE. Identify 6-8 logical units. 
  JSON: [{"title": "...", "summary": "brief description", "sourceRange": "pages/slides", "dependencies": []}]`;
  
  return await client.generate({ prompt, attachment, responseType: 'json', modelType: 'flash' });
};

export const generateStage2Core = async (section: any, attachment: any) => {
  const prompt = `STAGE 2 — CORE KNOWLEDGE for section: "${section.title}".
  Return JSON: {
    "summary": "Academic summary",
    "content": "Comprehensive theory in Markdown",
    "definitions": [{"term": "...", "definition": "..."}],
    "axioms": [{"label": "...", "expression": "LaTeX without $$ wrappers"}]
  }`;
  return await client.generate({ prompt, attachment, responseType: 'json', modelType: 'flash' });
};

export const generateStage3Logic = async (section: any, attachment: any) => {
  const prompt = `STAGE 3 — LOGIC MAP for section: "${section.title}".
  Mermaid mindmap syntax ONLY. Start with "mindmap".
  JSON: {"mindmap": "string"}`;
  return await client.generate({ prompt, attachment, responseType: 'json', modelType: 'flash' });
};

export const generateStage4Recall = async (section: any, attachment: any) => {
  const prompt = `STAGE 4 & 5 — ACTIVE RECALL for section: "${section.title}".
  Return JSON: {
    "flashcards": [{"question": "...", "answer": "..."}],
    "questions": [{"question": "...", "options": ["...", "..."], "correctIndex": 0, "explanation": "..."}]
  }`;
  return await client.generate({ prompt, attachment, responseType: 'json', modelType: 'flash' });
};

export const generateStage6Resources = async (section: any) => {
  const prompt = `STAGE 6 — LEARNING RESOURCES for section: "${section.title}".
  Find 3-5 authoritative clickable links.
  JSON Array: [{"title": "...", "type": "...", "platform": "...", "url": "...", "reason": "..."}]`;
  return await client.generate({ prompt, modelType: 'pro', useSearch: true, responseType: 'json' });
};

export const generateMoreQuestions = async (section: CourseSection, difficulty: number): Promise<PracticeQuestion[]> => {
  const prompt = `Generate 5 challenging MCQs for: ${section.title}. Difficulty ${difficulty}/5. JSON Array: [{question, options, correctIndex, explanation}]`;
  const raw = await client.generate({ prompt, responseType: 'json', modelType: 'flash' });
  return (raw || []).map((q: any) => ({ ...q, id: crypto.randomUUID(), hasBeenAnswered: false, difficultyLevel: difficulty }));
};

export const generateStudySchedule = async (subject: string, concepts: CourseSection[]): Promise<ScheduleItem[]> => {
  const prompt = `STAGE 7 — STUDY PLAN for: ${subject}. 7 sessions. JSON Array: [{title, durationMinutes, focus, activity}]`;
  return await client.generate({ prompt, responseType: 'json', modelType: 'flash' });
};
