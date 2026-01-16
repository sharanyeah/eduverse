
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, Concept } from '../types';
import { chatWithTutor, handleAIError } from '../services/geminiService';

interface ChatInterfaceProps {
  activeConcept: Concept;
  onUpdateMastery: (id: string, increase: number) => void;
  messages: Message[];
  onAddMessage: (msg: Message) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  activeConcept, 
  messages, 
  onAddMessage,
  onUpdateMastery
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: inputValue, timestamp: new Date().toISOString() };
    onAddMessage(userMsg);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatWithTutor(messages, activeConcept as any, inputValue);
      const modelMsg: Message = {
        role: 'model',
        text: response.text,
        timestamp: new Date().toISOString(),
        groundingScore: response.groundingScore,
        isExternal: response.isExternal,
        citations: response.citations
      };
      onAddMessage(modelMsg);
      onUpdateMastery(activeConcept.id, 2);
    } catch (error) {
      onAddMessage({ role: 'model', text: handleAIError(error), timestamp: new Date().toISOString() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-40">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center text-slate-300 text-2xl mb-6 shadow-sm">
              <i className="fas fa-microchip"></i>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Cognitive Link Idle</p>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">Interrogate the document context to reveal hidden insights.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] md:max-w-2xl flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-3 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${msg.isExternal ? 'bg-amber-500' : 'bg-emerald-500'}`}/>
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                    {msg.isExternal ? 'External Context' : 'Archive Grounded'}
                  </span>
                  <div className="h-3 w-px bg-slate-100 mx-1"/>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Neural Confidence: {msg.groundingScore}%</span>
                </div>
              )}
              <div className={`p-6 md:p-8 rounded-[2rem] text-[15px] leading-relaxed border shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-950 text-white border-slate-900 rounded-tr-none' 
                  : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
              }`}>
                <div className="prose prose-slate max-w-none prose-p:mb-4">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.text}</ReactMarkdown>
                </div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-2">
                    {msg.citations.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 rounded-lg shadow-sm">
                        <i className="fas fa-bookmark text-[8px] mr-2 opacity-30"></i>
                        {c.source}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-3xl w-fit shadow-sm animate-pulse">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><i className="fas fa-dna"/></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Processing Evidence Streams...</span>
          </div>
        )}
      </div>
      
      <div className="p-8 md:p-12 bg-white border-t border-slate-200 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto flex gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-200 focus-within:bg-white focus-within:shadow-2xl focus-within:border-indigo-300 transition-all duration-300">
          <textarea
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Propose a conceptual inquiry..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400 resize-none py-3 px-4"
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || !inputValue.trim()} 
            className="w-14 h-14 bg-slate-950 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 disabled:opacity-10 transition-all flex items-center justify-center"
          >
            <i className="fas fa-paper-plane text-sm"/>
          </button>
        </div>
        <p className="text-center mt-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">LearnVerse V5 Elite Core • Grounding Active</p>
      </div>
    </div>
  );
};

export default ChatInterface;
