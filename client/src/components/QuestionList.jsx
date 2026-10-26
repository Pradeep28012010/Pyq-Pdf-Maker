import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Check, 
  Layers, 
  Eye, 
  EyeOff, 
  Trash2, 
  Hash, 
  Award,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  Target
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
      <div className="no-print bg-white rounded-2xl p-12 border border-gray-200/80 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-gray-800">Fetching live questions from MARKS App...</p>
        <p className="text-xs text-gray-400">Loading formulas, diagrams, and verified solutions</p>
      </div>
    );
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="no-print bg-white rounded-2xl p-10 border border-gray-200/80 text-center space-y-2">
        <Layers className="w-8 h-8 text-gray-300 mx-auto" />
        <h4 className="text-sm font-semibold text-gray-700">No questions match your filters</h4>
        <p className="text-xs text-gray-400">Try adjusting your search keyword, question type, or difficulty filter above.</p>
      </div>
    );
  }

  const allSelected = questions.length > 0 && selectedIds.size === questions.length;

  return (
    <div className="no-print bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-3.5">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-gray-900">
            Questions Selection ({questions.length})
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
            {selectedIds.size} Selected for PDF
          </span>
          {starredIds.size > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              {starredIds.size} Starred
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
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
      <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
        {questions.map((q, idx) => {
          if (!q) return null;
          const qId = q._id || q.id || String(idx);
          const isSelected = selectedIds.has(qId);
          const isStarred = starredIds.has(qId);
          const isExpanded = expandedId === qId;
          const paperTitle = q.previousYearPapers?.[0]?.title || '';
          
          // Difficulty badge
          const diff = (q.difficulty || q.level || '').toLowerCase();
          const isEasy = diff.includes('easy') || diff === '1';
          const isHard = diff.includes('hard') || diff === '3';
          const isMedium = diff.includes('med') || diff === '2';

          return (
            <div
              key={qId}
              className={`p-3.5 rounded-xl border transition flex flex-col gap-2.5 ${
                isSelected
                  ? 'bg-indigo-50/30 border-indigo-200 shadow-2xs'
                  : 'bg-white border-gray-200 opacity-60 hover:opacity-100'
              }`}
            >
              {/* Question Row Header */}
              <div className="flex items-start justify-between gap-3">
                <div 
                  onClick={() => onToggleSelect(qId)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs text-indigo-950 bg-indigo-100/80 px-2 py-0.5 rounded">
                      Q.{idx + 1}
                    </span>
                    {paperTitle && (
                      <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[280px]">
                        {paperTitle}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      {q.type === 'numerical' ? '🔢 Numerical' : q.type === 'multipleCorrect' ? '☑️ Multi-Correct' : '🔘 MCQ'}
                    </span>

                    {/* Difficulty Badge if available */}
                    {isEasy && (
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        🟢 Easy
                      </span>
                    )}
                    {isMedium && (
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        🟡 Medium
                      </span>
                    )}
                    {isHard && (
                      <span className="text-[9px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        🔴 Hard
                      </span>
                    )}

                    {/* Accuracy rate if provided */}
                    {q.accuracy !== undefined && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                        🎯 {q.accuracy}% Acc
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Star toggle + View Solution toggle */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Star / Bookmark Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(qId);
                    }}
                    title={isStarred ? 'Remove from Starred' : 'Star for Revision'}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      isStarred
                        ? 'bg-amber-50 border-amber-300 text-amber-600'
                        : 'border-gray-200 text-gray-400 hover:text-amber-500 hover:bg-gray-50'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>

                  {/* Solution Toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : qId)}
                    title={isExpanded ? 'Hide Solution' : 'Preview Solution'}
                    className={`p-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition ${
                      isExpanded 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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
                className="text-xs text-gray-900 pl-8 cursor-pointer select-text leading-relaxed"
              >
                <MathView content={q.question || q.statement || q.text || ''} />
              </div>

              {/* Options pills */}
              <div className="pl-8 flex flex-wrap gap-1.5 text-[11px] text-gray-600">
                {q.type === 'numerical' ? (
                  <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono text-[10px]">
                    Answer Box (Numerical)
                  </span>
                ) : (
                  Array.isArray(q.options) && q.options.map((opt, oIdx) => (
                    <span
                      key={opt?.id || oIdx}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                        opt?.isCorrect && isExpanded
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      ({String.fromCharCode(65 + oIdx)})
                    </span>
                  ))
                )}
              </div>

              {/* Expanded Solution Drawer */}
              {isExpanded && (
                <div className="mt-2 pl-8 pt-3 border-t border-purple-100 space-y-2 text-xs">
                  {/* Verified Answer Badge */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[11px] text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Answer: {q.type === 'numerical' ? (q.correctValue ?? 'See Solution') : (
                        Array.isArray(q.options)
                          ? q.options.map((o, i) => o?.isCorrect ? String.fromCharCode(65 + i) : null).filter(Boolean).join(', ') || 'N/A'
                          : 'N/A'
                      )}
                    </span>
                  </div>

                  {/* Hint if present */}
                  {q.hint && (
                    <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-snug">
                      <strong>Concept / Hint: </strong>
                      <MathView content={q.hint} className="inline" />
                    </div>
                  )}

                  {/* Full Solution */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
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
