
import React, { useState } from 'react';
import { PracticeQuestion, CourseSection } from '../types';
import { generateMoreQuestions } from '../services/geminiService';

interface PracticeQuestionsProps {
  questions: PracticeQuestion[];
  activeSection: CourseSection;
  onUpdateQuestions: (qs: PracticeQuestion[]) => void;
  onCorrect: () => void;
}

export const ExamRoom: React.FC<PracticeQuestionsProps> = ({ questions, activeSection, onUpdateQuestions, onCorrect }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'review'>('all');
  const [genDifficulty, setGenDifficulty] = useState(3);

  const handleSelect = (qId: string, idx: number) => {
    const q = questions.find(item => item.id === qId);
    if (!q || q.hasBeenAnswered) return;

    const isCorrect = q.correctIndex === idx;
    const updated = questions.map(item => item.id === qId ? {
      ...item,
      hasBeenAnswered: true,
      wasCorrect: isCorrect
    } : item);

    onUpdateQuestions(updated);
    if (isCorrect) onCorrect();
  };

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    try {
      const more = await generateMoreQuestions(activeSection, genDifficulty);
      onUpdateQuestions([...questions, ...more]);
    } catch (e) {
      alert("Cognitive synthesis failed. Retry.");
    } finally {
      setIsGenerating(false);
    }
  };

  const visibleQuestions = (questions || []).filter(q => filter === 'all' ? true : (q.hasBeenAnswered && !q.wasCorrect));

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#fdfdfd] p-12">
      <div className="max-w-4xl mx-auto space-y-12 pb-32">
        <div className="flex justify-between items-end gap-8">
          <div className="space-y-4">
            <div className="inline-block px-4 py-1.5 bg-slate-950 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em]">Diagnostic Protocol</div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Exam Room</h3>
            <p className="text-slate-400 max-w-lg text-xs font-medium leading-relaxed">Incorrect responses are moved to the persistent review queue for iterative validation.</p>
          </div>
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl flex-shrink-0">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              All Probes
            </button>
            <button 
              onClick={() => setFilter('review')} 
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'review' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Review Queue ({(questions || []).filter(q => q.hasBeenAnswered && !q.wasCorrect).length})
            </button>
          </div>
        </div>

        <div className="space-y-10">
          {visibleQuestions.length === 0 ? (
             <div className="py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <i className="fas fa-clipboard-check text-slate-300 text-3xl mb-4"></i>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Archive Empty or Cleared</p>
             </div>
          ) : visibleQuestions.map((q, qIdx) => (
            <div key={q.id} className={`bg-white p-12 rounded-[3.5rem] border transition-all relative overflow-hidden group ${
              q.hasBeenAnswered ? q.wasCorrect ? 'border-emerald-100 bg-emerald-50/20' : 'border-rose-100 bg-rose-50/20' : 'border-slate-100 hover:border-indigo-100 shadow-sm'
            }`}>
              {q.hasBeenAnswered && !q.wasCorrect && <div className="absolute top-0 right-0 px-6 py-2 bg-rose-600 text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-bl-2xl">Requires Review</div>}
              
              <div className="flex gap-8 items-start mb-10">
                <span className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${q.hasBeenAnswered ? q.wasCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-300 border border-slate-100 group-hover:bg-slate-950 group-hover:text-white'}`}>Probe {qIdx + 1}</span>
                <p className="text-2xl font-black text-slate-900 leading-[1.3] tracking-tight pt-1">{q.question}</p>
              </div>
              
              <div className="grid gap-4">
                {q.options?.map((opt, i) => {
                  const isCorrectAnswer = i === q.correctIndex;
                  const hasAnswered = q.hasBeenAnswered;
                  
                  let buttonStyle = "bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100";
                  
                  if (hasAnswered) {
                    if (isCorrectAnswer) {
                      buttonStyle = "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100";
                    } else if (!q.wasCorrect && i === q.correctIndex) {
                      buttonStyle = "bg-emerald-600 text-white shadow-md";
                    } else if (hasAnswered && !q.wasCorrect) {
                      buttonStyle = "bg-rose-50/50 text-rose-800 border-rose-100 opacity-60";
                    } else {
                      buttonStyle = "bg-white text-slate-200 border-slate-50 opacity-40";
                    }
                  }
                  
                  return (
                    <button 
                      key={i} 
                      disabled={hasAnswered} 
                      onClick={() => handleSelect(q.id, i)} 
                      className={`w-full text-left p-7 rounded-[2rem] font-bold text-sm transition-all flex items-center gap-6 border ${buttonStyle}`}
                    >
                      <span className={`w-10 h-10 rounded-xl border flex items-center justify-center text-[11px] font-black ${hasAnswered ? 'border-white/20' : 'border-slate-200 bg-white'}`}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              
              {q.hasBeenAnswered && (
                <div className={`mt-10 p-8 rounded-[2.5rem] animate-in slide-in-from-top-4 border ${q.wasCorrect ? 'bg-white border-emerald-100 text-emerald-950' : 'bg-white border-rose-100 text-rose-950'}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <i className={q.wasCorrect ? 'fas fa-check-circle' : 'fas fa-info-circle'}></i>
                    {q.wasCorrect ? 'Verification Success' : 'Logical Insight for Review'}
                  </p>
                  <p className="text-sm font-medium leading-relaxed opacity-80">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-16 border-t border-slate-100 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Difficulty Level</span>
             <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-3xl border border-slate-200">
              <div className="flex gap-2">
                {[1,2,3,4,5].map(lv => (
                  <button 
                    key={lv} 
                    onClick={() => setGenDifficulty(lv)} 
                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${genDifficulty === lv ? 'bg-slate-950 text-white shadow-xl' : 'bg-white text-slate-300 hover:text-slate-950 border border-slate-100'}`}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleGenerateMore} 
            disabled={isGenerating} 
            className="px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-6 disabled:opacity-50"
          >
            {isGenerating ? <><i className="fas fa-circle-notch fa-spin"/>Synthesizing Probes...</> : <><i className="fas fa-plus"/>Generate 5 More Probes</>}
          </button>
        </div>
      </div>
    </div>
  );
};
