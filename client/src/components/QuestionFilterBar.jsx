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
  difficultyFilter = 'all',
  onDifficultyFilterChange,
  sessionFilter = 'all',
  onSessionFilterChange,
  onlyStarred = false,
  onToggleStarredOnly,
  starredCount = 0,
  totalCount = 0,
  selectedCount = 0,
  onSelectAll,
  onDeselectAll,
  onQuickSelect,
  onShuffle
}) {
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded"
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
              className={`px-2.5 py-1.5 rounded-lg transition ${
                typeFilter === 'all'
                  ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => onTypeFilterChange('singleCorrect')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                typeFilter === 'singleCorrect'
                  ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>MCQ</span>
            </button>
            <button
              onClick={() => onTypeFilterChange('numerical')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
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
              className={`px-2 py-1.5 rounded-lg transition ${
                difficultyFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Diff: All
            </button>
            <button
              onClick={() => onDifficultyFilterChange('easy')}
              className={`px-2 py-1.5 rounded-lg transition flex items-center gap-1 ${
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
              className={`px-2 py-1.5 rounded-lg transition flex items-center gap-1 ${
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
              className={`px-2 py-1.5 rounded-lg transition flex items-center gap-1 ${
                difficultyFilter === 'hard'
                  ? 'bg-white text-rose-800 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-rose-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Hard</span>
            </button>
          </div>

          {/* Year Filter Dropdown */}
          {availableYears.length > 0 && (
            <select
              value={yearFilter}
              onChange={(e) => onYearFilterChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-700"
            >
              <option value="all">All Years ({availableYears.length})</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y} PYQs</option>
              ))}
            </select>
          )}

          {/* Starred Questions Filter */}
          <button
            type="button"
            onClick={onToggleStarredOnly}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition ${
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
            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 transition flex items-center gap-1 shadow-2xs"
            title="Exact JEE Pattern: 20 MCQs + 5 Numerical Qs"
          >
            <Target className="w-3 h-3 text-indigo-600" />
            <span>NTA Mock (20 MCQ + 5 Num)</span>
          </button>

          {/* 15 Qs Speed Sprint */}
          <button
            onClick={() => onQuickSelect(15)}
            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
          >
            ⚡ 15 Qs Speed Sprint
          </button>

          {/* Top 25 Full Test */}
          <button
            onClick={() => onQuickSelect(25)}
            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
          >
            First 25 Qs
          </button>

          {/* 2024 Latest */}
          <button
            onClick={() => onQuickSelect('2024')}
            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition"
          >
            2024 PYQs
          </button>

          {/* Shuffle Questions */}
          <button
            onClick={onShuffle}
            className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold border border-purple-200 transition flex items-center gap-1"
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
            className="px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition border border-indigo-200"
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
