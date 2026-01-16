
import React from 'react';
import { Workspace } from '../types';

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onNewFile: () => void;
  onSelectSection: (index: number) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  workspaces, activeWorkspaceId, onSelectWorkspace, onNewFile, onSelectSection, onClearAll, isOpen, onToggle
}) => {
  const activeWorkspace = workspaces.find(w => w.fileInfo.id === activeWorkspaceId);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'ppt': return <i className="fas fa-file-powerpoint text-amber-500"></i>;
      case 'pdf': return <i className="fas fa-file-pdf text-rose-500"></i>;
      default: return <i className="fas fa-file-alt text-indigo-500"></i>;
    }
  };

  return (
    <>
      {isOpen && <div className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40" onClick={onToggle}/>}
      <aside className={`fixed lg:static top-0 left-0 w-80 bg-white border-r border-slate-200 h-screen flex flex-col z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'}`}>
        <div className="p-8 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-200"><i className="fas fa-university"/></div>
              <div>
                <span className="font-black text-lg text-slate-950 block leading-none tracking-tighter">LearnVerse</span>
                <span className="text-[7px] font-black uppercase text-indigo-600 tracking-[0.4em]">Elite Protocol</span>
              </div>
            </div>
            <button onClick={onNewFile} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-950 border border-slate-200 transition-colors"><i className="fas fa-plus"/></button>
          </div>

          {activeWorkspace && (
            <div className="mb-8 p-5 bg-slate-50/80 rounded-[2rem] border border-slate-200 space-y-5">
              <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cognitive Coverage</span></div>
              <div className="space-y-4">
                {[
                  { label: 'Ingestion', val: activeWorkspace.coverageStats?.ingested || 0, color: 'bg-indigo-600' },
                  { label: 'Retention', val: activeWorkspace.coverageStats?.retained || 0, color: 'bg-amber-500' },
                  { label: 'Validation', val: activeWorkspace.coverageStats?.validated || 0, color: 'bg-emerald-500' }
                ].map(stat => (
                  <div key={stat.label} className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">{stat.label}</span>
                      <span className="text-slate-900">{stat.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${stat.color} transition-all duration-1000 ease-out`} style={{ width: `${stat.val}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em] ml-1 mb-4 block">Knowledge Archives</label>
              <div className="space-y-2">
                {workspaces.map(w => (
                  <button key={w.fileInfo.id} onClick={() => onSelectWorkspace(w.fileInfo.id)} className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center gap-4 border ${activeWorkspaceId === w.fileInfo.id ? 'bg-slate-950 border-slate-950 text-white shadow-xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                    <div className="w-5 flex justify-center text-sm">{getFileIcon(w.fileInfo.type)}</div>
                    <span className="text-[10px] font-black truncate flex-1 uppercase tracking-tight">{w.fileInfo.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {activeWorkspace && (
              <div>
                <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em] ml-1 mb-4 block">Unit Segments</label>
                <div className="space-y-2">
                  {activeWorkspace.sections.map((s, idx) => (
                    <button key={s.id} onClick={() => onSelectSection(idx)} className={`w-full text-left px-5 py-5 rounded-2xl border transition-all relative ${activeWorkspace.activeSectionIndex === idx ? 'bg-indigo-50 border-indigo-200 text-indigo-950 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                      {s.mastery >= 80 && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                      <div className="text-[11px] font-bold leading-tight">{s.title}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-2">{s.sourceReference}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-5">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-[10px] shadow-lg">JD</div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-300 tracking-[0.3em] mb-0.5">Scholar Access</p>
              <p className="text-[11px] font-bold text-slate-950">Verified Member</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
