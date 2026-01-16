
import React from 'react';
import { CourseSection } from '../types';

interface LearningGraphProps {
  sections: CourseSection[];
  activeIndex: number;
}

export const LearningGraph: React.FC<LearningGraphProps> = ({ sections, activeIndex }) => {
  const nodeRadius = 28;
  const nodeGap = 160;
  
  return (
    <div className="w-full h-full bg-[#F8FAFC] relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0F172A 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}></div>
      
      <div className="max-w-full overflow-auto p-20 custom-scrollbar">
        <svg width={sections.length * nodeGap + 120} height={400} className="mx-auto">
          {/* Edge Shadows */}
          {sections.map((s, idx) => (
            idx < sections.length - 1 && (
              <line 
                key={`edge-shadow-${idx}`}
                x1={idx * nodeGap + 60} y1={202} 
                x2={(idx + 1) * nodeGap + 60} y2={202} 
                stroke="#0F172A" strokeWidth="3" opacity="0.05"
              />
            )
          ))}
          
          {/* Edges */}
          {sections.map((s, idx) => (
            idx < sections.length - 1 && (
              <line 
                key={`edge-${idx}`}
                x1={idx * nodeGap + 60} y1={200} 
                x2={(idx + 1) * nodeGap + 60} y2={200} 
                stroke={idx < activeIndex ? "#10B981" : "#E2E8F0"} 
                strokeWidth="2"
                strokeDasharray={idx >= activeIndex ? "8,8" : "0"}
              />
            )
          ))}
          
          {/* Nodes */}
          {sections.map((s, idx) => {
            const isActive = idx === activeIndex;
            const isCompleted = s.mastery >= 80;
            const isAccessible = idx <= activeIndex;
            const x = idx * nodeGap + 60;
            const y = 200;
            
            return (
              <g key={s.id} className={`transition-all duration-500 ${isAccessible ? 'opacity-100' : 'opacity-40'}`}>
                {/* Node Glow */}
                {isActive && <circle cx={x} cy={y} r={nodeRadius + 15} fill="#4F46E5" opacity="0.1" />}
                
                <circle 
                  cx={x} cy={y} r={nodeRadius} 
                  fill={isActive ? '#0F172A' : isCompleted ? '#10B981' : '#FFFFFF'} 
                  stroke={isActive ? '#0F172A' : '#E2E8F0'} 
                  strokeWidth="2"
                  className="shadow-xl"
                />
                
                {isCompleted ? (
                  <text x={x} y={y + 4} textAnchor="middle" fill="#FFFFFF" className="text-[12px] font-black">✓</text>
                ) : (
                  <text x={x} y={y + 4} textAnchor="middle" fill={isActive ? '#FFFFFF' : '#94A3B8'} className="text-[10px] font-black uppercase tracking-tighter">
                    U{idx + 1}
                  </text>
                )}

                <foreignObject x={x - 60} y={y + 40} width="120" height="80">
                  <div className="flex flex-col items-center text-center gap-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                      {s.title}
                    </span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                      {s.mastery}% Verified
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="absolute top-12 left-12 p-8 glass-card rounded-[2.5rem] border border-slate-200/60 max-w-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-project-diagram"/></div>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-950">Architectural Pathway</h3>
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          LearnVerse computes prerequisites based on conceptual overlap and hierarchical dependencies discovered in the core archive.
        </p>
      </div>
    </div>
  );
};
