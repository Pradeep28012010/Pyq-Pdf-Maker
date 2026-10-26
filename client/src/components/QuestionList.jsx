import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Check, 
  Layers, 
  Eye, 
  EyeOff, 
  Star
} from 'lucide-react';
import MathView from '../utils/mathRenderer';

export default function QuestionList({
  questions = [],
  selectedIds = new Set(),
  starredIds = new Set(),
  onToggleSelect,
  onToggleStar,
  onSelectAll,
  onDeselectAll,
  loading
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (loading) {
    return (
      <div className="no-print glass-panel rounded-3xl p-12 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-800">Fetching live questions from MARKS App...</p>
        <p className="text-xs text-slate-400">Rendering formulas, diagrams, and verified solutions</p>
      </div>
    );
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="no-print glass-panel rounded-3xl p-10 text-center space-y-2">
        <Layers className="w-8 h-8 text-slate-300 mx-auto" />
        <h4 className="text-sm font-semibold text-slate-700">No questions match your filters</h4>
        <p className="text-xs text-slate-400">Try adjusting your search keyword, question type, or difficulty filter above.</p>
      </div>
    );
  }

  const allSelected = questions.length > 0 && selectedIds.size === questions.length;

  return (
    <div className="no-print glass-panel rounded-3xl p-6 space-y-4 transition-all duration-300">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/50">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-extrabold text-slate-900 tracking-tight">
            Question Selector ({questions.length})
          </span>
          <span className="text-xs px-3 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] font-bold border border-[#0071e3]/20">
            {selectedIds.size} Selected for PDF
          </span>
          {starredIds.size > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-800 font-bold border border-amber-400/30 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              {starredIds.size} Starred
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="px-3.5 py-1.5 text-xs font-bold text-[#0071e3] bg-blue-50/80 hover:bg-blue-100 rounded-full flex items-center gap-1.5 transition-all cursor-pointer border border-blue-200/60 shadow-2xs"
          >
            {allSelected ? (
              <>
                <Square className="w-3.5 h-3.5" /> Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" /> Select All ({questions.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          if (!q) return null;
          const qId = q._id || q.id || String(idx);
          const isSelected = selectedIds.has(qId);
          const isStarred = starredIds.has(qId);
          const isExpanded = expandedId === qId;
          const paperTitle = q.previousYearPapers?.[0]?.title || '';
          
          // Difficulty badge
          const diff = String(q.difficulty ?? q.level ?? '').toLowerCase();
          const isEasy = diff.includes('easy') || diff === '1';
          const isHard = diff.includes('hard') || diff === '3';
          const isMedium = diff.includes('med') || diff === '2';

          return (
            <div
              key={qId}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 ${
                isSelected
                  ? 'bg-blue-50/70 border-[#0071e3]/40 shadow-xs ring-1 ring-[#0071e3]/30'
                  : 'bg-white/60 hover:bg-white/95 border-white/80 opacity-90 hover:opacity-100 shadow-2xs hover:scale-[1.005]'
              }`}
            >
              {/* Question Row Header */}
              <div className="flex items-start justify-between gap-3">
                <div 
                  onClick={() => onToggleSelect(qId)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  {/* Apple Style Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all duration-200 shrink-0 ${
                      isSelected
                        ? 'bg-[#0071e3] border-[#0071e3] text-white shadow-[0_2px_6px_rgba(0,113,227,0.4)]'
                        : 'border-slate-300 bg-white/80'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs text-blue-950 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200/50">
                      Q.{idx + 1}
                    </span>
                    {paperTitle && (
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200/60 truncate max-w-[280px]">
                        {paperTitle}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      {q.type === 'numerical' ? '🔢 Numerical' : q.type === 'multipleCorrect' ? '☑️ Multi-Correct' : '🔘 MCQ'}
                    </span>

                    {/* Difficulty Badge */}
                    {isEasy && (
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/20">
                        🟢 Easy
                      </span>
                    )}
                    {isMedium && (
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-500/10 px-2 py-0.2 rounded-full border border-amber-500/20">
                        🟡 Medium
                      </span>
                    )}
                    {isHard && (
                      <span className="text-[9px] font-bold text-rose-800 bg-rose-500/10 px-2 py-0.2 rounded-full border border-rose-500/20">
                        🔴 Hard
                      </span>
                    )}

                    {/* Accuracy rate */}
                    {q.accuracy !== undefined && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-500/10 px-2 py-0.2 rounded-full border border-blue-500/20">
                        🎯 {q.accuracy}% Acc
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Star toggle + View Solution toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Star / Bookmark Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(qId);
                    }}
                    title={isStarred ? 'Remove from Starred' : 'Star for Revision'}
                    className={`p-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                      isStarred
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-600 shadow-xs'
                        : 'border-white/80 bg-white/60 text-slate-400 hover:text-amber-500 hover:bg-white shadow-2xs'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>

                  {/* Solution Toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : qId)}
                    title={isExpanded ? 'Hide Solution' : 'Preview Solution'}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                      isExpanded 
                        ? 'bg-purple-100 text-purple-900 border-purple-200 shadow-2xs' 
                        : 'bg-white/60 text-slate-600 border-white/80 hover:bg-white hover:text-slate-900 shadow-2xs'
                    }`}
                  >
                    {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'Solution'}</span>
                  </button>
                </div>
              </div>

              {/* Rendered Math & Text Statement */}
              <div 
                onClick={() => onToggleSelect(qId)}
                className="text-xs text-slate-900 pl-8 cursor-pointer select-text leading-relaxed"
              >
                <MathView content={q.question || q.statement || q.text || ''} />
              </div>

              {/* Options pills */}
              <div className="pl-8 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                {q.type === 'numerical' ? (
                  <span className="px-2.5 py-0.5 bg-slate-100/90 border border-slate-200/80 rounded-full font-mono text-[10px]">
                    Answer Box (Numerical)
                  </span>
                ) : (
                  Array.isArray(q.options) && q.options.map((opt, oIdx) => (
                    <span
                      key={opt?.id || oIdx}
                      className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] border ${
                        opt?.isCorrect && isExpanded
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                          : 'bg-white/70 border-slate-200/70'
                      }`}
                    >
                      ({String.fromCharCode(65 + oIdx)})
                    </span>
                  ))
                )}
              </div>

              {/* Expanded Solution Drawer */}
              {isExpanded && (
                <div className="mt-2 pl-8 pt-3 border-t border-purple-200/60 space-y-2.5 text-xs">
                  {/* Verified Answer Badge */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[11px] text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                      Answer: {q.type === 'numerical' ? (q.correctValue ?? 'See Solution') : (
                        Array.isArray(q.options)
                          ? q.options.map((o, i) => o?.isCorrect ? String.fromCharCode(65 + i) : null).filter(Boolean).join(', ') || 'N/A'
                          : 'N/A'
                      )}
                    </span>
                  </div>

                  {/* Hint if present */}
                  {q.hint && (
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 text-[11px] leading-snug">
                      <strong>Concept / Hint: </strong>
                      <MathView content={q.hint} className="inline" />
                    </div>
                  )}

                  {/* Full Solution */}
                  <div className="glass-panel-subtle p-3.5 rounded-2xl border border-white/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Detailed Derivation:
                    </span>
                    <MathView content={q.solution || 'No detailed solution available for this question.'} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
