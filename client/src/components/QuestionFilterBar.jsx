import React from 'react';
import { 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  Sparkles, 
  X, 
  Hash, 
  Calendar, 
  Layers, 
  Shuffle, 
  Star, 
  Award,
  Zap,
  Target
} from 'lucide-react';

export default function QuestionFilterBar({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  yearFilter,
  onYearFilterChange,
  availableYears = [],
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
    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3.5">
      {/* Top Search & Filter row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions by formula, concept or keyword (e.g. moment of inertia, resonance)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Question Type Filter */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => onTypeFilterChange('all')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => onTypeFilterChange('singleCorrect')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                typeFilter === 'singleCorrect'
                  ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>MCQ</span>
            </button>
            <button
              onClick={() => onTypeFilterChange('numerical')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                typeFilter === 'numerical'
                  ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Hash className="w-3 h-3" />
              <span>Numerical</span>
            </button>
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => onDifficultyFilterChange('all')}
              className={`px-2 py-1.5 rounded-lg transition cursor-pointer ${
                difficultyFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Diff: All
            </button>
            <button
              onClick={() => onDifficultyFilterChange('easy')}
              className={`px-2 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                difficultyFilter === 'easy'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Easy</span>
            </button>
            <button
              onClick={() => onDifficultyFilterChange('medium')}
              className={`px-2 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                difficultyFilter === 'medium'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Med</span>
            </button>
            <button
              onClick={() => onDifficultyFilterChange('hard')}
              className={`px-2 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                difficultyFilter === 'hard'
                  ? 'bg-white text-rose-800 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-rose-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Hard</span>
            </button>
          </div>

          {/* Starred Questions Filter */}
          <button
            type="button"
            onClick={onToggleStarredOnly}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition cursor-pointer ${
              onlyStarred
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
            <span>Starred ({starredCount})</span>
          </button>
        </div>
      </div>

      {/* Interactive Year Selector Strip */}
      {availableYearsWithCount.length > 0 && (
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Select Particular Year(s):
            </span>

            {/* All Years Reset Pill */}
            <button
              type="button"
              onClick={onSelectAllYears}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                isAllYearsActive
                  ? 'bg-indigo-600 text-white shadow-2xs font-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold ring-1 ring-indigo-500 shadow-2xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  title={`Toggle ${year} PYQs`}
                >
                  <span>{year}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded-full ${
                    isSelected ? 'bg-indigo-200/80 text-indigo-900 font-extrabold' : 'bg-gray-100 text-gray-500'
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
                className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs border border-purple-200 transition cursor-pointer"
                title="Select last 5 years of PYQs"
              >
                Last 5 Yrs
              </button>
            )}
          </div>

          {/* Quick Year Selection actions */}
          {selectedYears.size > 0 && onSelectVisibleQuestions && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 font-medium">
                Showing {filteredCount} Qs
              </span>
              <button
                type="button"
                onClick={onSelectVisibleQuestions}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                title="Select all questions matching active years into printable PDF"
              >
                <CheckSquare className="w-3 h-3 text-emerald-600" />
                <span>Select {selectedYears.size} Year{selectedYears.size > 1 ? 's' : ''} for PDF</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Select & Exam Sprint Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            MARKS Exam Modes:
          </span>

          {/* NTA Pattern Mock Preset */}
          <button
            onClick={() => onQuickSelect('nta-pattern')}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Exact JEE Pattern: 20 MCQs + 5 Numerical Qs"
          >
            <Target className="w-3 h-3 text-indigo-600" />
            <span>NTA Mock (20 MCQ + 5 Num)</span>
          </button>

          {/* 15 Qs Speed Sprint */}
          <button
            onClick={() => onQuickSelect(15)}
            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition cursor-pointer"
          >
            ⚡ 15 Qs Speed Sprint
          </button>

          {/* Top 25 Full Test */}
          <button
            onClick={() => onQuickSelect(25)}
            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition cursor-pointer"
          >
            First 25 Qs
          </button>

          {/* Shuffle Questions */}
          <button
            onClick={onShuffle}
            className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold border border-purple-200 transition flex items-center gap-1 cursor-pointer"
            title="Randomize question order so you don't memorize patterns"
          >
            <Shuffle className="w-3 h-3 text-purple-600" />
            <span>Shuffle Order</span>
          </button>
        </div>

        {/* Global Select / Deselect */}
        <div className="flex items-center gap-2">
          <button
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            className="px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition border border-indigo-200 cursor-pointer"
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
