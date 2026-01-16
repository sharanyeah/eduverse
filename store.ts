
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, CourseSection } from './types';

interface TutorState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  isEnriching: boolean;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspaceId: (id: string) => void;
  setIsEnriching: (status: boolean) => void;
  addWorkspace: (ws: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  getActiveWorkspace: () => Workspace | undefined;
}

export const useTutorStore = create<TutorState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: '',
      isEnriching: false,
      
      setWorkspaces: (workspaces) => set({ workspaces }),
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      setIsEnriching: (status) => set({ isEnriching: status }),
      
      addWorkspace: (ws) => set((state) => ({ 
        workspaces: [ws, ...state.workspaces],
        activeWorkspaceId: ws.fileInfo.id
      })),
      
      updateWorkspace: (id, updates) => set((state) => {
        const updatedWorkspaces = state.workspaces.map(ws => {
          if (ws.fileInfo.id === id) {
            const merged = { ...ws, ...updates };
            
            // DETERMINISTIC METRICS CALCULATION
            const totalSections = merged.sections.length;
            const ingested = merged.sections.filter(s => !!s.content).length;
            
            const allFlashcards = merged.sections.flatMap(s => s.flashcards);
            const masteredFlashcards = allFlashcards.filter(f => f.masteryStatus === 'mastered').length;
            
            const allQuestions = merged.sections.flatMap(s => s.practiceQuestions);
            const answeredCorrect = allQuestions.filter(q => q.hasBeenAnswered && q.wasCorrect).length;

            merged.coverageStats = {
              ingested: Math.round((ingested / (totalSections || 1)) * 100),
              retained: Math.round((masteredFlashcards / (allFlashcards.length || 1)) * 100),
              validated: Math.round((answeredCorrect / (allQuestions.length || 1)) * 100)
            };
            
            return merged;
          }
          return ws;
        });
        return { workspaces: updatedWorkspaces };
      }),
      
      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find(w => w.fileInfo.id === activeWorkspaceId);
      }
    }),
    {
      name: 'learnverse-v5-storage',
      partialize: (state) => ({ workspaces: state.workspaces, activeWorkspaceId: state.activeWorkspaceId }),
    }
  )
);
