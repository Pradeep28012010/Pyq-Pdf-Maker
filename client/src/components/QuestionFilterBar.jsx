import React from 'react';
import { 
  Search, 
  CheckSquare, 
  Square, 
  X, 
  Hash, 
  Calendar, 
  Shuffle, 
  Star, 
  Zap, 
  Target 
} from 'lucide-react';

export default function QuestionFilterBar({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  yearFilter,
  _onYearFilterChange,
  _availableYears = [],
  availableYearsWithCount = [],
  selectedYears = new Set(),
  onToggleYear,
  onSelectAllYears,
  onSelectLastNYears,
  onSelectVisibleQuestions,
  difficultyFilter = 'all',
  onDifficultyFilterChange,
  sessionFilter = 'all',
  onSessionFilterChange,
  onlyStarred = false,
  onToggleStarredOnly,
  starredCount = 0,
  totalCount = 0,
  selectedCount = 0,
  filteredCount = 0,
  onSelectAll,
  onDeselectAll,
  onQuickSelect,
  onShuffle
}) {
  const isAllYearsActive = selectedYears.size === 0 && yearFilter === 'all';

  return (
    <div className="no-print glass-panel rounded-3xl p-5 space-y-4 transition-all duration-300">
      {/* Top Search & Filter row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Apple-style Pill Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions by formula, concept or keyword (e.g. moment of inertia, resonance)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-xs bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all shadow-2xs text-slate-800 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Question Type Apple Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-200/50 backdrop-blur-md p-1 rounded-full border border-white/60 text-xs font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
            <button
              onClick={() => onTypeFilterChange('all')}
              className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => onTypeFilterChange('singleCorrect')}
              className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                typeFilter === 'singleCorrect'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>MCQ</span>
            </button>
            <button
              onClick={() => onTypeFilterChange('numerical')}
              className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                typeFilter === 'numerical'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3 h-3 text-slate-500" />
              <span>Numerical</span>
            </button>
          </div>

          {/* Difficulty Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-200/50 backdrop-blur-md p-1 rounded-full border border-white/60 text-xs font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
            <button
              onClick={() => onDifficultyFilterChange('all')}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                difficultyFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Diff: All
            </button>
            <button
              onClick={() => onDifficultyFilterChange('easy')}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                difficultyFilter === 'easy'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#34c759]" />
              <span>Easy</span>
            </button>
            <button
              onClick={() => onDifficultyFilterChange('medium')}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                difficultyFilter === 'medium'
                  ? 'bg-white text-amber-800 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#ff9500]" />
              <span>Med</span>
            </button>
            <button
              onClick={() => onDifficultyFilterChange('hard')}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                difficultyFilter === 'hard'
                  ? 'bg-white text-rose-800 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#ff3b30]" />
              <span>Hard</span>
            </button>
          </div>

          {/* Shift Session Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-200/50 backdrop-blur-md p-1 rounded-full border border-white/60 text-xs font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
            <button
              onClick={() => onSessionFilterChange && onSessionFilterChange('all')}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                sessionFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Session: All
            </button>
            <button
              onClick={() => onSessionFilterChange && onSessionFilterChange('jan')}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                sessionFilter === 'jan'
                  ? 'bg-white text-[#0071e3] shadow-sm font-bold'
                  : 'text-slate-500 hover:text-[#0071e3]'
              }`}
            >
              Jan
            </button>
            <button
              onClick={() => onSessionFilterChange && onSessionFilterChange('apr')}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                sessionFilter === 'apr'
                  ? 'bg-white text-purple-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-purple-700'
              }`}
            >
              Apr
            </button>
          </div>

          {/* Starred Questions Glass Pill */}
          <button
            type="button"
            onClick={onToggleStarredOnly}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all duration-200 cursor-pointer ${
              onlyStarred
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-900 font-bold shadow-xs'
                : 'bg-white/60 border-white/80 text-slate-600 hover:bg-white/90 shadow-2xs'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span>Starred ({starredCount})</span>
          </button>
        </div>
      </div>

      {/* Interactive Year Selector Strip */}
      {availableYearsWithCount.length > 0 && (
        <div className="pt-3 border-t border-slate-200/50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#0071e3]" />
              Year(s):
            </span>

            {/* All Years Reset Pill */}
            <button
              type="button"
              onClick={onSelectAllYears}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                isAllYearsActive
                  ? 'glass-btn-primary text-white shadow-xs font-black'
                  : 'bg-white/60 hover:bg-white/95 text-slate-700 border border-white/80 shadow-2xs'
              }`}
            >
              All Years ({totalCount})
            </button>

            {/* Individual Year Pills */}
            {availableYearsWithCount.map(({ year, count }) => {
              const isSelected = selectedYears.has(year);
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => onToggleYear(year)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 border-[#0071e3] text-blue-950 font-bold ring-1 ring-[#0071e3] shadow-xs'
                      : 'bg-white/60 hover:bg-white/95 border-white/80 text-slate-700 shadow-2xs'
                  }`}
                  title={`Toggle ${year} PYQs`}
                >
                  <span>{year}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-[#0071e3]/20 text-[#0071e3]' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Quick 5-Year shortcut */}
            {availableYearsWithCount.length >= 3 && onSelectLastNYears && (
              <button
                type="button"
                onClick={() => onSelectLastNYears(5)}
                className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-800 hover:bg-purple-500/20 font-semibold text-xs border border-purple-500/20 transition-all cursor-pointer"
                title="Select last 5 years of PYQs"
              >
                Last 5 Yrs
              </button>
            )}
          </div>

          {/* Quick Year Selection actions */}
          {selectedYears.size > 0 && onSelectVisibleQuestions && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Showing {filteredCount} Qs
              </span>
              <button
                type="button"
                onClick={onSelectVisibleQuestions}
                className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 font-bold text-xs rounded-full border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Select all questions matching active years into printable PDF"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Select {selectedYears.size} Year{selectedYears.size > 1 ? 's' : ''} for PDF</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Select & Exam Sprint Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200/50 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Exam Presets:
          </span>

          {/* NTA Pattern Mock Preset */}
          <button
            onClick={() => onQuickSelect('nta-pattern')}
            className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100/80 text-[#0071e3] font-bold border border-blue-200/80 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-[1.02]"
            title="Exact JEE Pattern: 20 MCQs + 5 Numerical Qs"
          >
            <Target className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>NTA Mock (20 MCQ + 5 Num)</span>
          </button>

          {/* 15 Qs Speed Sprint */}
          <button
            onClick={() => onQuickSelect(15)}
            className="px-3 py-1 rounded-full bg-white/70 hover:bg-white/95 text-slate-700 font-semibold border border-white/80 shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
          >
            ⚡ 15 Qs Speed Sprint
          </button>

          {/* Top 25 Full Test */}
          <button
            onClick={() => onQuickSelect(25)}
            className="px-3 py-1 rounded-full bg-white/70 hover:bg-white/95 text-slate-700 font-semibold border border-white/80 shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
          >
            First 25 Qs
          </button>

          {/* 2024 Latest PYQs */}
          <button
            onClick={() => onQuickSelect('2024')}
            className="px-3 py-1 rounded-full bg-blue-50/80 hover:bg-blue-100/90 text-[#0071e3] font-semibold border border-blue-200/80 shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
            title="Filter and select 2024 PYQs"
          >
            📅 2024 PYQs
          </button>

          {/* Shuffle Questions */}
          <button
            onClick={onShuffle}
            className="px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.02]"
            title="Randomize question order so you don't memorize patterns"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-600" />
            <span>Shuffle Order</span>
          </button>
        </div>

        {/* Global Select / Deselect */}
        <div className="flex items-center gap-2">
          <button
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            className="px-3.5 py-1 text-xs font-bold text-[#0071e3] bg-blue-50/70 hover:bg-blue-100/80 rounded-full flex items-center gap-1.5 transition-all border border-blue-200/60 shadow-2xs cursor-pointer"
          >
            {selectedCount === totalCount ? (
              <>
                <Square className="w-3.5 h-3.5" /> Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" /> Select All ({totalCount})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
