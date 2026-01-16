
import React, { useRef, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { useTutorStore } from './store';
import Sidebar from './components/Sidebar';
import ResourceViewer from './components/ResourceViewer';
import { 
  getDocumentStructure, 
  generateStage2Core, 
  generateStage3Logic, 
  generateStage4Recall, 
  generateStage6Resources, 
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
      setProcessingPhase('DeepTutor Stage 1: Structure Extraction...');
      try {
        const skeleton = await getDocumentStructure(file);
        const sections: CourseSection[] = skeleton.map((s: any, idx: number) => ({
          ...s,
          id: crypto.randomUUID(),
          status: idx === 0 ? 'in-progress' : 'locked',
          mastery: 0,
          content: '',
          keyTerms: [],
          formulas: [],
          mindmap: '',
          summary: s.summary || '',
          detailedSummary: '',
          title: s.title || 'Untitled Unit',
          sourceReference: s.sourceRange || s.sourceReference || '',
          chatHistory: [],
          flashcards: [],
          practiceQuestions: [],
          dependencies: s.dependencies || []
        }));

        const newWs: Workspace = {
          fileInfo: { 
            id: crypto.randomUUID(), 
            name: file.name, 
            type: file.name.endsWith('.ppt') || file.name.endsWith('.pptx') ? 'ppt' : file.name.endsWith('.pdf') ? 'pdf' : 'txt',
            uploadDate: new Date().toISOString() 
          },
          subject: file.name.replace(/\.[^/.]+$/, ""),
          sections,
          activeSectionIndex: 0,
          attachment: file,
          coverageStats: { ingested: 0, retained: 0, validated: 0 }
        };
        return newWs;
      } catch (err: any) {
        setErrorMessage(handleAIError(err));
        throw err;
      } finally {
        setProcessingPhase('');
      }
    },
    onSuccess: (newWs) => {
      addWorkspace(newWs);
      enrichSectionProgressive(newWs, 0);
    }
  });

  const enrichSectionProgressive = async (ws: Workspace, index: number) => {
    const section = ws.sections[index];
    if (!ws.attachment) return;

    const updateSect = (updates: Partial<CourseSection>) => {
      updateWorkspace(ws.fileInfo.id, {
        sections: ws.sections.map((s, idx) => idx === index ? { ...s, ...updates } : s)
      });
    };

    setIsEnriching(true);
    try {
      // Stage 2: Core
      updateSect({ isCoreLoading: true });
      const core = await generateStage2Core(section, ws.attachment);
      updateSect({
        content: core.content,
        summary: core.summary,
        detailedSummary: core.summary, // Initially the same
        keyTerms: (core.definitions || []).map((d: any) => ({ term: d.term, definition: d.definition })),
        formulas: (core.axioms || []).map((a: any) => ({ expression: a.expression, label: a.label })),
        isCoreLoading: false
      });

      // Stage 3: Logic
      updateSect({ isLogicLoading: true });
      const logic = await generateStage3Logic(section, ws.attachment);
      updateSect({ mindmap: logic.mindmap, isLogicLoading: false });

      // Stage 4/5: Recall
      updateSect({ isRecallLoading: true });
      const recall = await generateStage4Recall(section, ws.attachment);
      updateSect({
        flashcards: (recall.flashcards || []).map((f: any) => ({
          id: crypto.randomUUID(),
          question: f.question,
          answer: f.answer,
          masteryStatus: 'learning',
          failureCount: 0,
          difficulty: 'medium'
        })),
        practiceQuestions: (recall.questions || []).map((q: any) => ({
          ...q,
          id: crypto.randomUUID(),
          hasBeenAnswered: false,
          difficultyLevel: 3,
          options: q.options || ["A", "B", "C", "D"]
        })),
        isRecallLoading: false
      });

      // Stage 6: Resources
      updateSect({ isResourcesLoading: true });
      const resources = await generateStage6Resources(section);
      updateSect({ 
        resources: (resources || []).map((r: any) => ({ ...r, score: 0.9 })), 
        isResourcesLoading: false 
      });

    } catch (err: any) {
      setErrorMessage(handleAIError(err));
    } finally {
      setIsEnriching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachment({ data: base64, mimeType: file.type || 'application/octet-stream', name: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {!activeWorkspaceId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-24 space-y-16">
          <div className="max-w-2xl w-full text-center space-y-8">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-950 leading-[0.9]">Deep<span className="text-indigo-600">Tutor</span></h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-lg mx-auto">Production-grade academic orchestration engine.</p>
          </div>
          <div className="w-full max-w-xl space-y-6">
            <div onClick={() => fileInputRef.current?.click()} className={`w-full aspect-video border-2 border-dashed rounded-[3rem] cursor-pointer transition-all upload-zone flex flex-col items-center justify-center gap-6 group ${attachment ? 'bg-indigo-50/30 border-indigo-400' : 'bg-white border-slate-200 hover:border-indigo-400'}`}>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.ppt,.pptx" />
              <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-105">
                <i className={attachment ? "fas fa-file-check text-indigo-600" : "fas fa-file-arrow-up text-slate-300"} />
              </div>
              <p className="font-black uppercase tracking-widest text-xs text-slate-500">{attachment ? attachment.name : 'Ingest Study Document'}</p>
            </div>
            {processingPhase && <div className="p-8 bg-slate-950 text-white rounded-[2.5rem] flex items-center gap-6 animate-pulse"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div><p className="text-sm font-bold">{processingPhase}</p></div>}
            {!processingPhase && <button disabled={!attachment || initMutation.isPending} onClick={() => attachment && initMutation.mutate(attachment)} className="w-full h-20 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl neo-brutalist-button disabled:opacity-10 transition-all">Initialize Workspace</button>}
          </div>
        </div>
      ) : (
        <div className="flex w-full h-full">
          <Sidebar 
            workspaces={workspaces} 
            activeWorkspaceId={activeWorkspaceId} 
            onSelectWorkspace={(id) => setActiveWorkspaceId(id)} 
            onNewFile={() => { setAttachment(null); setActiveWorkspaceId(''); }}
            onSelectSection={(idx) => {
              updateWorkspace(activeWorkspaceId, { activeSectionIndex: idx });
              const ws = getActiveWorkspace();
              if (ws && !ws.sections[idx].content && !ws.sections[idx].isCoreLoading) {
                 enrichSectionProgressive(ws, idx);
              }
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            onClearAll={() => { if (confirm("Global purge?")) { useTutorStore.getState().setWorkspaces([]); setActiveWorkspaceId(''); } }}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          <main className="flex-1 relative overflow-hidden">
            {activeWorkspace && (
              <ResourceViewer 
                activeWorkspace={activeWorkspace} 
                onUpdateWorkspace={(updates) => updateWorkspace(activeWorkspace.fileInfo.id, updates)} 
                onNextSection={() => {
                  const nextIdx = activeWorkspace.activeSectionIndex + 1;
                  if (nextIdx < activeWorkspace.sections.length) {
                    updateWorkspace(activeWorkspaceId, { activeSectionIndex: nextIdx });
                    enrichSectionProgressive(activeWorkspace, nextIdx);
                  }
                }}
                isEnriching={false} 
              />
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
