
import React, { useState, useEffect } from 'react';
import MermaidDiagram from './MermaidDiagram';

interface MindmapEditorProps {
  initialChart: string;
  onSave: (chart: string) => void;
}

export const MindmapEditor: React.FC<MindmapEditorProps> = ({ initialChart, onSave }) => {
  const [chart, setChart] = useState(initialChart);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { setChart(initialChart); }, [initialChart]);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      <div className="flex-1 overflow-hidden relative group">
        <div className="h-full flex items-center justify-center p-12 bg-white">
          <MermaidDiagram chart={chart} />
        </div>
        
        <div className="absolute top-10 right-10 flex gap-4">
          <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 bg-slate-950 text-white rounded-2xl shadow-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
            {isEditing ? 'Close Architect' : 'Open Architect'}
          </button>
          {isEditing && (
             <button onClick={() => { onSave(chart); setIsEditing(false); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
               Commit Map
             </button>
          )}
        </div>

        {isEditing && (
          <div className="absolute inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-2xl p-10 flex flex-col animate-in slide-in-from-right-4">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Node Architecture</h4>
            <div className="flex-1 relative">
              <textarea 
                value={chart}
                onChange={(e) => setChart(e.target.value)}
                className="w-full h-full bg-slate-50 p-6 rounded-[2rem] font-mono text-xs border-none outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                placeholder="mindmap\n  Root\n    Topic 1\n    Topic 2"
              />
            </div>
            <div className="mt-8 space-y-4">
              <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">Logic Protocol: Use indentation to define structural hierarchy. Prefix with 'mindmap'.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-10 border-t border-slate-100 bg-white/50 flex items-center justify-center gap-12">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 text-xs"><i className="fas fa-mouse-pointer"/></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interaction: Pan & Zoom Supported</p>
        </div>
        <div className="h-4 w-px bg-slate-200"/>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 text-xs"><i className="fas fa-code-branch"/></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode: Real-time SVG Synchronization</p>
        </div>
      </div>
    </div>
  );
};
