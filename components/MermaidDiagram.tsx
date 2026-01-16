
import React, { useEffect, useRef } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      
      let cleanChart = chart.trim();
      
      // 1. Markdown stripping
      cleanChart = cleanChart.replace(/^```mermaid\s+/i, '').replace(/```$/i, '').trim();
      
      const rawLines = cleanChart.split('\n').filter(l => l.trim().length > 0);
      const processedLines: string[] = [];
      let rootFound = false;

      // 2. Strict Mindmap Sanitization Loop
      for (let line of rawLines) {
        const trimmed = line.trim();
        
        // Handle mindmap keyword
        if (trimmed.toLowerCase().startsWith('mindmap')) {
          if (processedLines.length === 0) processedLines.push('mindmap');
          continue;
        }

        // Node content cleaning: Remove characters that break Mermaid syntax
        let content = trimmed
          .replace(/[\(\)\[\]\{\}":;]/g, ' ') 
          .replace(/[&]/g, 'and')
          .replace(/[#]/g, ' ')
          .replace(/[-*+]/g, ' ') // Remove markdown bullets if present
          .trim();

        if (!content) continue;

        if (!rootFound) {
          // The very first non-keyword line MUST be the root
          // Ensure it has NO leading spaces to define it as level 0
          processedLines.push('  ' + content); 
          rootFound = true;
        } else {
          // All subsequent lines must have indentation. 
          // If they have 0 indentation, they are "orphans" that cause "There can be only one root" errors.
          // We force a minimum of 4 spaces for orphans to keep them under the root.
          const originalIndentMatch = line.match(/^\s*/);
          const originalIndent = originalIndentMatch ? originalIndentMatch[0] : '';
          
          // Force at least 4 spaces if it looks like an extra root (0 or 2 spaces)
          const finalIndent = originalIndent.length <= 2 ? '    ' : originalIndent + '  ';
          processedLines.push(finalIndent + content);
        }
      }

      // Ensure "mindmap" is the header
      if (processedLines[0] !== 'mindmap') {
        processedLines.unshift('mindmap');
      }

      const finalChart = processedLines.join('\n');

      try {
        // @ts-ignore
        window.mermaid.initialize({ 
          startOnLoad: false, 
          theme: 'neutral', 
          securityLevel: 'loose',
          fontFamily: 'Inter',
          mindmap: {
            useMaxWidth: true,
          }
        });
        
        // Use a unique ID for each render to avoid collisions
        const renderId = 'mermaid-svg-' + Math.random().toString(36).substr(2, 9);
        
        // @ts-ignore
        window.mermaid.render(renderId, finalChart).then(({ svg }) => {
          if (ref.current) ref.current.innerHTML = svg;
        }).catch((err: unknown) => {
          console.error("Mermaid Render Error", err);
          if (ref.current) {
            ref.current.innerHTML = `
              <div class="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-4">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center mb-2">Structure Protocol Deviation</p>
                <p class="text-[9px] font-medium text-slate-300 text-center max-w-[200px]">The visual engine encountered a non-standard hierarchy. Use the architect panel to verify node indentation.</p>
              </div>
            `;
          }
        });
      } catch (e: unknown) {
        console.error("Mermaid critical fail", e);
      }
    }
  }, [chart]);

  return <div key={chart} ref={ref} className="mermaid flex justify-center w-full overflow-x-auto p-4 transition-opacity duration-300"></div>;
};

export default MermaidDiagram;
