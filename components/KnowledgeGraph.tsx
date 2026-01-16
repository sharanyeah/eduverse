
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Concept } from '../types';

interface KnowledgeGraphProps {
  concepts: Concept[];
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ concepts }) => {
  const data = concepts.map(c => ({
    subject: c.title.length > 15 ? c.title.substring(0, 12) + '...' : c.title,
    A: c.mastery,
    fullMark: 100,
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-800">Knowledge State</h3>
        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full font-semibold">Real-time</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#f1f5f9" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Radar
              name="Mastery"
              dataKey="A"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.15}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-tighter">Avg Mastery</div>
          <div className="text-lg font-bold text-indigo-700">
            {Math.round(concepts.reduce((acc, c) => acc + c.mastery, 0) / (concepts.length || 1))}%
          </div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl">
          <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-tighter">Concepts Met</div>
          <div className="text-lg font-bold text-emerald-700">
            {concepts.filter(c => c.status === 'completed' || c.mastery > 80).length} / {concepts.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
