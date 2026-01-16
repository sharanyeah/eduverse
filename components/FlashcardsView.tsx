
import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';

interface FlashcardsViewProps {
  cards: Flashcard[];
  onAdd: (q: string, a: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, q: string, a: string) => void;
  onApproveSuggestion: (id: string) => void;
  onUpdateStatus: (id: string, status: 'learning' | 'mastered') => void;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ 
  cards, onAdd, onDelete, onUpdate, onApproveSuggestion, onUpdateStatus 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [filter, setFilter] = useState<'all' | 'learning' | 'mastered'>('all');

  const activeCards = (cards || []).filter(c => filter === 'all' ? true : c.masteryStatus === filter);

  useEffect(() => {
    if (activeCards.length > 0 && currentIndex >= activeCards.length) setCurrentIndex(0);
  }, [activeCards.length]);

  const currentCard = activeCards[currentIndex];

  const handleSave = () => {
    if (!q || !a) return;
    if (editId) onUpdate(editId, q, a);
    else onAdd(q, a);
    setQ(''); setA(''); setEditId(null); setIsEditorOpen(false);
  };

  const markStatus = (id: string, status: 'learning' | 'mastered') => {
    onUpdateStatus(id, status);
    setIsFlipped(false);
    // Slight delay to allow flip animation to "unflip" before moving to next card
    setTimeout(() => { 
      if (currentIndex < activeCards.length - 1) setCurrentIndex(currentIndex + 1); 
      else setCurrentIndex(0); 
    }, 150);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fdfdfd] overflow-y-auto custom-scrollbar p-12 lg:p-24">
      <div className="max-w-4xl mx-auto w-full space-y-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Active Recall Active</div>
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Cognitive Retention</h3>
            <p className="text-slate-400 font-medium text-xs">Iterative spaced repetition to anchor conceptual units into long-term memory.</p>
          </div>
          <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
            {(['all', 'learning', 'mastered'] as const).map(f => (
              <button key={f} onClick={() => { setFilter(f); setCurrentIndex(0); setIsFlipped(false); }} className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === f ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{f}</button>
            ))}
          </div>
        </div>

        {activeCards.length > 0 && currentCard ? (
          <div className="flex flex-col items-center gap-12">
            <div className="w-full max-w-xl h-[450px] perspective-1000">
              <div 
                className={`w-full h-full relative transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`} 
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front Side */}
                <div className="absolute inset-0 bg-white border border-slate-100 rounded-[3.5rem] p-16 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 text-2xl mb-12">
                    <i className="fas fa-brain"/>
                  </div>
                  <p className="text-3xl font-black text-slate-950 leading-tight tracking-tight">{currentCard.question}</p>
                  <div className="mt-16 px-6 py-3 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-full">
                    Click to Reveal Synthesis
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 bg-slate-950 rounded-[3.5rem] p-16 flex flex-col items-center justify-center text-center shadow-2xl text-white backface-hidden rotate-y-180">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl mb-12">
                    <i className="fas fa-bolt"/>
                  </div>
                  <p className="text-2xl font-medium leading-relaxed text-slate-200 mb-12">
                    {currentCard.answer}
                  </p>
                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={(e) => { e.stopPropagation(); markStatus(currentCard.id, 'learning'); }} 
                      className="flex-1 py-5 bg-white/10 hover:bg-rose-500/20 text-rose-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Needs Practice
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); markStatus(currentCard.id, 'mastered'); }} 
                      className="flex-1 py-5 bg-indigo-600 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all"
                    >
                      Mastered
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <button 
                onClick={() => { setIsFlipped(false); setCurrentIndex(p => Math.max(0, p - 1)); }} 
                disabled={currentIndex === 0} 
                className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 hover:text-slate-950 shadow-xl disabled:opacity-10 transition-all"
              >
                <i className="fas fa-chevron-left"/>
              </button>
              <div className="px-10 py-4 bg-slate-950 text-white rounded-[2rem] font-black text-xs tracking-widest shadow-2xl">
                {currentIndex + 1} / {activeCards.length}
              </div>
              <button 
                onClick={() => { setIsFlipped(false); if (currentIndex < activeCards.length - 1) setCurrentIndex(currentIndex + 1); else setCurrentIndex(0); }} 
                className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 hover:text-slate-950 shadow-xl transition-all"
              >
                <i className="fas fa-chevron-right"/>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
             <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-200 text-4xl">
               <i className="fas fa-clone"/>
             </div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active nodes in this archive</p>
          </div>
        )}

        <button 
          onClick={() => setIsEditorOpen(true)} 
          className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[3.5rem] flex flex-col items-center gap-4 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
            <i className="fas fa-plus"/>
          </div>
          <span className="text-xs font-black uppercase text-slate-400 tracking-widest group-hover:text-indigo-950">Anchor New Conceptual Node</span>
        </button>

        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-xl p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
              <h4 className="text-2xl font-black text-slate-950 tracking-tight">Seed New Knowledge</h4>
              <div className="space-y-6">
                <textarea 
                  value={q} 
                  onChange={e => setQ(e.target.value)} 
                  className="w-full p-8 bg-slate-50 border-none rounded-[2rem] font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" 
                  placeholder="Conceptual Inquiry..."
                />
                <textarea 
                  value={a} 
                  onChange={e => setA(e.target.value)} 
                  className="w-full p-8 bg-slate-50 border-none rounded-[2rem] font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" 
                  placeholder="Logical Synthesis..."
                />
                <div className="flex gap-4">
                  <button onClick={handleSave} className="flex-1 py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">
                    Commit to Archive
                  </button>
                  <button onClick={() => setIsEditorOpen(false)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase text-xs tracking-widest">
                    Discard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsView;
