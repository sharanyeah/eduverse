
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
      <div className="px-12 py-12 border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-30 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-4">
             <span className="px-4 py-1.5 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Unit {sectionIndex + 1}</span>
             {section.difficultyLevel && (
               <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black uppercase tracking-widest rounded-xl">
                 Level: {section.difficultyLevel}
               </span>
             )}
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter leading-[0.9]">{section.title}</h2>
        </div>
        
        <div className="flex gap-2 p-2 bg-slate-100/80 rounded-[2rem] border border-slate-200 shadow-inner">
          {[
            { id: 'learn', icon: 'fa-book-open', label: 'Theory' },
            { id: 'mindmap', icon: 'fa-project-diagram', label: 'Topology' },
            { id: 'tutor', icon: 'fa-brain', label: 'Inquiry' },
            { id: 'recall', icon: 'fa-clone', label: 'Retention' },
            { id: 'verify', icon: 'fa-certificate', label: 'Diagnose' },
            { id: 'resources', icon: 'fa-link', label: 'Nodes' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)} 
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === t.id 
                  ? 'bg-white text-slate-950 shadow-2xl border border-slate-200 scale-[1.05]' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className={`fas ${t.icon} text-xs`}/>
              <span className="text-[11px] font-black uppercase tracking-widest hidden xl:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="h-full">
          {activeTab === 'learn' && (
            <div className="h-full overflow-y-auto p-12 lg:p-24 custom-scrollbar bg-white">
              {!section.content && (
                <div className="flex flex-col items-center justify-center py-48 animate-in fade-in zoom-in-95">
                  <div className="relative w-24 h-24 mb-10">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Synchronizing Unit Context...</p>
                </div>
              )}
              
              {section.content && (
                <div className="max-w-5xl mx-auto space-y-32 animate-in fade-in duration-1000">
                  <section className="bg-slate-50 border border-slate-200 p-16 rounded-[4rem] shadow-sm relative overflow-hidden group">
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.5em] mb-8">Conceptual Abstraction</h4>
                    <p className="text-3xl md:text-4xl font-black text-slate-950 leading-[1.1] tracking-tight italic">
                      "{section.detailedSummary || section.summary}"
                    </p>
                  </section>
                  
                  <div className="prose prose-slate lg:prose-xl max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-slate-950 prose-p:text-[20px] prose-p:leading-[1.8] prose-p:font-medium prose-p:text-slate-600 prose-strong:text-indigo-600 prose-ul:list-disc prose-li:marker:text-indigo-400">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{section.content}</ReactMarkdown>
                  </div>

                  {section.lexicon && section.lexicon.length > 0 && (
                    <div className="space-y-16 pt-24 border-t border-slate-100">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl"><i className="fas fa-language text-xl"/></div>
                        <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-slate-950 leading-none">Domain Lexicon</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {section.lexicon.map((l, i) => (
                          <div key={i} className="bg-indigo-50/30 p-10 rounded-[3rem] border border-indigo-100/50 group hover:bg-white hover:shadow-xl transition-all">
                            <p className="text-base font-black text-indigo-950 uppercase tracking-tight mb-4 flex items-center gap-4">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform"></span>
                              {l.word}
                            </p>
                            <p className="text-[15px] text-slate-500 font-medium leading-relaxed">{l.meaning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {section.keyTerms && section.keyTerms.length > 0 && (
                    <div className="space-y-16 pt-24 border-t border-slate-100">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center shadow-2xl"><i className="fas fa-spell-check text-xl"/></div>
                        <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-slate-950 leading-none">Core Definitions</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {section.keyTerms.map((t, i) => (
                          <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:border-indigo-300 hover:shadow-xl transition-all group">
                            <p className="text-base font-black text-slate-950 uppercase tracking-tight mb-4 flex items-center gap-4">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform"></span>
                              {t.term}
                            </p>
                            <p className="text-[15px] text-slate-500 font-medium leading-relaxed">{t.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.formulas && section.formulas.length > 0 && (
                    <div className="space-y-16 pt-24 border-t border-slate-100">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-amber-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl"><i className="fas fa-atom text-xl"/></div>
                        <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-slate-950 leading-none">Technical Axioms</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-10">
                        {section.formulas.map((f, i) => (
                          <div key={i} className="bg-slate-950 p-16 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                            <p className="text-[12px] font-black text-amber-400 uppercase tracking-[0.4em] mb-10">{f.label}</p>
                            <div className="text-white bg-white/5 p-12 rounded-[2.5rem] overflow-x-auto border border-white/10 backdrop-blur-md">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$$${f.expression}$$`}</ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === 'mindmap' && (
            <div className="h-full">
               {!section.mindmap ? (
                  <div className="h-full flex flex-col items-center justify-center p-20 animate-pulse bg-white">
                    <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-10"></div>
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Rendering Structural Topology...</p>
                  </div>
               ) : (
                  <MindmapEditor initialChart={section.mindmap} onSave={m => updateSection({ mindmap: m })} />
               )}
            </div>
          )}
          {activeTab === 'tutor' && (
            <ChatInterface 
              activeConcept={section as Concept} 
              onUpdateMastery={(id, inc) => updateSection({ mastery: Math.min(100, section.mastery + inc) })} 
              messages={section.chatHistory}
              onAddMessage={(msg) => updateSection({ chatHistory: [...section.chatHistory, msg] })}
            />
          )}
          {activeTab === 'recall' && (
            <FlashcardsView 
              cards={section.flashcards}
              onAdd={(q, a) => updateSection({ flashcards: [...section.flashcards, { id: crypto.randomUUID(), question: q, answer: a, masteryStatus: 'learning', failureCount: 0, difficulty: 'medium' }] })}
              onDelete={id => updateSection({ flashcards: section.flashcards.filter(c => c.id !== id) })}
              onUpdate={(id, q, a) => updateSection({ flashcards: section.flashcards.map(c => c.id === id ? { ...c, question: q, answer: a } : c) })}
              onApproveSuggestion={id => updateSection({ flashcards: section.flashcards.map(c => c.id === id ? { ...c, isAiSuggested: false } : c) })}
              onUpdateStatus={(id, s) => updateSection({ flashcards: section.flashcards.map(c => c.id === id ? { ...c, masteryStatus: s } : c) })}
            />
          )}
          {activeTab === 'verify' && (
            <ExamRoom 
              questions={section.practiceQuestions} 
              activeSection={section} 
              onUpdateQuestions={qs => updateSection({ practiceQuestions: qs })} 
              onCorrect={() => updateSection({ mastery: Math.min(100, section.mastery + 5) })} 
              workspace={activeWorkspace}
            />
          )}
          {activeTab === 'resources' && (
            <div className="h-full overflow-y-auto bg-[#F8FAFC] p-12 lg:p-24 custom-scrollbar">
              <div className="max-w-5xl mx-auto space-y-24">
                 <div className="text-center space-y-8">
                   <div className="w-28 h-28 bg-white border border-slate-200 rounded-[3.5rem] flex items-center justify-center text-indigo-600 text-5xl mx-auto shadow-2xl transition-transform hover:rotate-12 cursor-pointer"><i className="fas fa-compass-drafting"/></div>
                   <h3 className="text-5xl font-black text-slate-950 tracking-tighter">Authority Grounding Nodes</h3>
                   <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[11px]">Verified External Academic References</p>
                 </div>
                 
                 <div className="grid gap-12">
                  {!section.resources || section.resources.length === 0 ? (
                    <div className="text-center py-48 bg-white border-2 border-slate-100 rounded-[5rem] border-dashed">
                       <p className="text-slate-300 font-black uppercase text-[12px] tracking-[0.6em]">Awaiting Resource Discovery...</p>
                    </div>
                  ) : (
                    section.resources.map((res, i) => (
                      <a 
                        key={i} 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-white p-16 rounded-[5rem] border border-slate-100 flex items-center justify-between hover:border-indigo-600 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-12 relative z-10">
                          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-4xl text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all border border-slate-100">
                            <i className={res.type === 'video' ? 'fab fa-youtube' : 'fas fa-book-reader'}/>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.4em]">{res.platform} • {res.type}</p>
                            <h4 className="font-black text-slate-950 text-3xl tracking-tight">{res.title}</h4>
                            <p className="text-lg text-slate-400 font-medium max-w-xl leading-relaxed">{res.reason}</p>
                          </div>
                        </div>
                        <div className="hidden md:flex flex-col items-end gap-6 relative z-10">
                           <span className="px-6 py-2.5 bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl">Linked Authority</span>
                           <i className="fas fa-chevron-right text-slate-200"></i>
                        </div>
                      </a>
                    ))
                  )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
