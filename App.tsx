
import React, { useRef, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { useTutorStore } from './store';
import Sidebar from './components/Sidebar';
import ResourceViewer from './components/ResourceViewer';
import { 
  getDocumentStructure, 
  synthesizeUnitWorkspace,
  handleAIError 
} from './services/geminiService';
import { FileAttachment, CourseSection, Workspace } from './types';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { 
    workspaces, 
    activeWorkspaceId, 
    addWorkspace, 
    updateWorkspace, 
    setActiveWorkspaceId,
    setIsEnriching,
    getActiveWorkspace
  } = useTutorStore();
  
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingPhase, setProcessingPhase] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeWorkspace = getActiveWorkspace();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initMutation = useMutation({
    mutationFn: async (file: FileAttachment) => {
      setErrorMessage(null);
      setProcessingPhase('Topology Scan...');
      try {
        const skeleton = await getDocumentStructure(file);
        const sections: CourseSection[] = skeleton.map((s: any, idx: number) => ({
          ...s,
          id: crypto.randomUUID(),
          status: idx === 0 ? 'in-progress' : 'locked',
          mastery: 0,
          content: '',
          keyTerms: [],
          lexicon: [],
          formulas: [],
          mindmap: '',
          summary: s.summary || '',
          detailedSummary: '',
          title: s.title || `Segment ${idx + 1}`,
          sourceReference: `Section ${idx + 1}`,
          chatHistory: [],
          flashcards: [],
          practiceQuestions: [],
          dependencies: []
        }));

        return {
          fileInfo: { 
            id: crypto.randomUUID(), 
            name: file.name, 
            type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt',
            uploadDate: new Date().toISOString() 
          },
          subject: file.name.replace(/\.[^/.]+$/, ""),
          sections,
          activeSectionIndex: 0,
          attachment: file,
          coverageStats: { ingested: 0, retained: 0, validated: 0 }
        } as Workspace;
      } catch (err: any) {
        setErrorMessage(handleAIError(err));
        throw err;
      } finally {
        setProcessingPhase('');
      }
    },
    onSuccess: (newWs) => {
      addWorkspace(newWs);
      enrichSection(newWs, 0);
    }
  });

  const enrichSection = async (ws: Workspace, index: number) => {
    const section = ws.sections[index];
    if (section.isSynthesized || !ws.attachment) return;

    setIsEnriching(true);
    setProcessingPhase(`Synthesizing ${section.title}...`);
    
    try {
      const fullSynthesis = await synthesizeUnitWorkspace(section, ws.attachment);
      updateWorkspace(ws.fileInfo.id, {
        sections: ws.sections.map((s, idx) => idx === index ? { ...s, ...fullSynthesis } : s)
      });
    } catch (err: any) {
      setErrorMessage(handleAIError(err));
    } finally {
      setIsEnriching(false);
      setProcessingPhase('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachment({ data: base64, mimeType: file.type || 'application/octet-stream', name: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden font-sans">
      {!activeWorkspaceId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-24 space-y-16">
          <div className="max-w-3xl w-full text-center space-y-8 animate-in fade-in duration-1000">
            <h1 className="text-8xl md:text-[9rem] font-black tracking-tight text-slate-950 leading-[0.8] mb-4">
              Deep<span className="text-indigo-600">Tutor</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-bold uppercase tracking-[0.4em]">Netlify Production Protocol Active</p>
          </div>

          <div className="w-full max-w-xl space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-video border-2 border-dashed rounded-[3.5rem] cursor-pointer transition-all flex flex-col items-center justify-center gap-6 group ${
                attachment ? 'bg-indigo-50/50 border-indigo-400 shadow-2xl' : 'bg-white border-slate-200 hover:border-indigo-400'
              }`}
            >
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" />
              <div className="w-24 h-24 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform">
                <i className={attachment ? "fas fa-shield-check text-indigo-600" : "fas fa-upload text-slate-300"} />
              </div>
              <p className="font-black uppercase tracking-[0.2em] text-[11px] text-slate-400 text-center px-8">
                {attachment ? attachment.name : 'Secure Archive Ingestion'}
              </p>
            </div>

            {processingPhase && (
              <div className="p-12 bg-slate-950 text-white rounded-[3rem] flex flex-col gap-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-indigo-400">Cognitive Orchestration</p>
                    <p className="text-lg font-bold text-slate-200">{processingPhase}</p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 animate-[loading-shimmer_2s_infinite] w-[40%]"></div>
                </div>
              </div>
            )}

            {!processingPhase && (
              <button 
                disabled={!attachment || initMutation.isPending}
                onClick={() => attachment && initMutation.mutate(attachment)}
                className="w-full h-24 bg-slate-950 text-white rounded-[3rem] font-black uppercase tracking-[0.6em] text-[12px] shadow-2xl hover:bg-slate-900 active:scale-[0.98] transition-all"
              >
                Initalize Secure Learning Path
              </button>
            )}
            
            {errorMessage && <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-rose-600 text-center font-bold">{errorMessage}</div>}
          </div>
        </div>
      ) : (
        <div className="flex w-full h-full relative">
          <Sidebar 
            workspaces={workspaces} 
            activeWorkspaceId={activeWorkspaceId} 
            onSelectWorkspace={(id) => setActiveWorkspaceId(id)} 
            onNewFile={() => setActiveWorkspaceId('')}
            onSelectSection={(idx) => {
              updateWorkspace(activeWorkspaceId, { activeSectionIndex: idx });
              const ws = getActiveWorkspace();
              if (ws) enrichSection(ws, idx);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            onClearAll={() => { useTutorStore.getState().setWorkspaces([]); setActiveWorkspaceId(''); }}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          <main className="flex-1 relative">
            {activeWorkspace && (
              <ResourceViewer 
                activeWorkspace={activeWorkspace} 
                onUpdateWorkspace={(updates) => updateWorkspace(activeWorkspace.fileInfo.id, updates)} 
                onNextSection={() => {
                  const nxt = activeWorkspace.activeSectionIndex + 1;
                  if (nxt < activeWorkspace.sections.length) {
                    updateWorkspace(activeWorkspaceId, { activeSectionIndex: nxt });
                    enrichSection(activeWorkspace, nxt);
                  }
                }}
                isEnriching={false}
              />
            )}
            {processingPhase && (
               <div className="absolute bottom-12 right-12 z-50 bg-white border border-slate-200 px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-5 animate-in slide-in-from-right-8 border-l-4 border-l-indigo-600">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">DeepTutor Synthesis</span>
                    <span className="text-xs font-bold text-slate-800">{processingPhase}</span>
                  </div>
               </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
