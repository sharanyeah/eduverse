
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Workspace, CourseSection, Concept } from '../types';
import ChatInterface from './ChatInterface';
import FlashcardsView from './FlashcardsView';
import { ExamRoom } from './ExamRoom';
import { MindmapEditor } from './MindmapEditor';

interface ResourceViewerProps {
  activeWorkspace: Workspace;
  onUpdateWorkspace: (w: Partial<Workspace>) => void;
  onNextSection: () => void;
  isEnriching: boolean;
}

const LoadingSkeleton = ({ label }: { label: string }) => (
  <div className="h-full flex flex-col items-center justify-center p-20 animate-pulse bg-white">
    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">{label}</p>
  </div>
);

export default function ResourceViewer({ activeWorkspace, onUpdateWorkspace, onNextSection, isEnriching }: ResourceViewerProps) {
  const [activeTab, setActiveTab] = useState<'learn' | 'mindmap' | 'tutor' | 'recall' | 'verify' | 'resources'>('learn');
  const sectionIndex = activeWorkspace.activeSectionIndex;
  const section = activeWorkspace.sections[sectionIndex];

  if (!section) return null;

  const updateSection = (updates: Partial<CourseSection>) => {
    onUpdateWorkspace({
      sections: activeWorkspace.sections.map((s, idx) => idx === sectionIndex ? { ...s, ...updates } : s)
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] h-full overflow-hidden">
      <div className="px-10 pt-10 pb-6 border-b border-slate-200 bg-white/50 backdrop-blur-md sticky top-0 z-30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-950 tracking-tighter leading-none">{section.title}</h2>
          <div className="flex gap-2">
            <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">{section.sourceReference}</span>
          </div>
        </div>
        
        <div className="flex gap-1 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          {[
            { id: 'learn', icon: 'fa-book-open', label: 'Theory' },
            { id: 'mindmap', icon: 'fa-project-diagram', label: 'Mindmap' },
            { id: 'tutor', icon: 'fa-brain', label: 'Tutor' },
            { id: 'recall', icon: 'fa-clone', label: 'Retention' },
            { id: 'verify', icon: 'fa-certificate', label: 'Exam' },
            { id: 'resources', icon: 'fa-link', label: 'Links' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === t.id ? 'bg-white text-slate-950 shadow-md border border-slate-200' : 'text-slate-400'
              }`}
            >
              <i className={`fas ${t.icon} text-xs`}/>
              <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'learn' && (
          section.isCoreLoading && !section.content ? <LoadingSkeleton label="Synthesizing Core Knowledge..." /> : (
            <div className="h-full overflow-y-auto p-12 md:p-20 custom-scrollbar bg-white">
              <div className="max-w-4xl mx-auto space-y-20">
                <section className="bg-slate-50 border border-slate-200 p-10 rounded-[3rem]">
                  <p className="text-xl md:text-2xl font-black text-slate-950 leading-[1.3] italic">"{section.summary}"</p>
                </section>
                <div className="prose prose-slate max-w-none prose-headings:font-black bg-slate-50/50 p-12 rounded-[3.5rem] border border-slate-100">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{section.content || 'Content generation in progress...'}</ReactMarkdown>
                </div>
                {section.keyTerms?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-slate-100">
                    {section.keyTerms.map((t, i) => (
                      <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-sm font-black text-slate-900 uppercase mb-2">{t.term}</p><p className="text-xs text-slate-500 font-medium">{t.definition}</p></div>
                    ))}
                  </div>
                )}
                {section.formulas?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-slate-100">
                    {section.formulas.map((f, i) => (
                      <div key={i} className="bg-slate-950 p-8 rounded-[2.5rem] shadow-2xl"><p className="text-[10px] font-black text-amber-400 uppercase mb-4">{f.label}</p><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$$${f.expression}$$`}</ReactMarkdown></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {activeTab === 'mindmap' && (section.isLogicLoading && !section.mindmap ? <LoadingSkeleton label="Mapping Conceptual Logic..." /> : <MindmapEditor initialChart={section.mindmap} onSave={m => updateSection({ mindmap: m })} />)}
        {activeTab === 'tutor' && <ChatInterface activeConcept={section as Concept} onUpdateMastery={(id, inc) => updateSection({ mastery: Math.min(100, section.mastery + inc) })} messages={section.chatHistory} onAddMessage={(msg) => updateSection({ chatHistory: [...section.chatHistory, msg] })} />}
        {activeTab === 'recall' && (section.isRecallLoading && section.flashcards.length === 0 ? <LoadingSkeleton label="Generating Active Recall Nodes..." /> : (
          <FlashcardsView 
            cards={section.flashcards}
            onAdd={(q, a) => updateSection({ flashcards: [...section.flashcards, { id: crypto.randomUUID(), question: q, answer: a, masteryStatus: 'learning', failureCount: 0, difficulty: 'medium' }] })}
            onDelete={id => updateSection({ flashcards: section.flashcards.filter(c => c.id !== id) })}
            onUpdate={(id, q, a) => updateSection({ flashcards: section.flashcards.map(c => c.id === id ? { ...c, question: q, answer: a } : c) })}
            onApproveSuggestion={id => updateSection({ flashcards: section.flashcards.map(c => c.id === id ? { ...c, isAiSuggested: false } : c) })}
            onUpdateStatus={(id, s) => updateSection({ flashcards: section.flashcards.map(c => c.id === id ? { ...c, masteryStatus: s } : c) })}
          />
        ))}
        {activeTab === 'verify' && (section.isRecallLoading && section.practiceQuestions.length === 0 ? <LoadingSkeleton label="Synthesizing Knowledge Probes..." /> : <ExamRoom questions={section.practiceQuestions} activeSection={section} onUpdateQuestions={qs => updateSection({ practiceQuestions: qs })} onCorrect={() => updateSection({ mastery: Math.min(100, section.mastery + 5) })} />)}
        {activeTab === 'resources' && (section.isResourcesLoading && (!section.resources || section.resources.length === 0) ? <LoadingSkeleton label="Finding Authoritative Links..." /> : (
          <div className="h-full overflow-y-auto bg-[#F8FAFC] p-12 md:p-24 custom-scrollbar">
            <div className="max-w-4xl mx-auto grid gap-8">
              {(section.resources || []).map((res, i) => (
                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="bg-white p-10 rounded-[3rem] border border-slate-100 flex items-center justify-between hover:border-indigo-600 transition-all group">
                  <div><p className="text-[10px] font-black uppercase text-indigo-600 mb-1">{res.platform} • {res.type}</p><h4 className="font-black text-slate-900 text-xl">{res.title}</h4><p className="text-sm text-slate-400 font-medium">{res.reason}</p></div>
                  <i className="fas fa-chevron-right text-slate-200 group-hover:text-indigo-600 transition-all"></i>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
