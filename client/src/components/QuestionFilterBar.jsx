import React from 'react';
import { Search, Filter, CheckSquare, Square, Sparkles, X, Hash, Calendar, Layers } from 'lucide-react';

export default function QuestionFilterBar({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  yearFilter,
  onYearFilterChange,
  availableYears = [],
  totalCount = 0,
  selectedCount = 0,
  onSelectAll,
  onDeselectAll,
  onQuickSelect
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
      {/* Top Search & Filter row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions by formula, concept or keyword (e.g. friction, momentum)..."
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

        {/* Question Type Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => onTypeFilterChange('all')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                typeFilter === 'all'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => onTypeFilterChange('singleCorrect')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                typeFilter === 'singleCorrect'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>MCQ</span>
            </button>
            <button
              onClick={() => onTypeFilterChange('numerical')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                typeFilter === 'numerical'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Hash className="w-3 h-3" />
              <span>Numerical</span>
            </button>
          </div>

          {/* Year Filter Dropdown */}
          {availableYears.length > 0 && (
            <select
              value={yearFilter}
              onChange={(e) => onYearFilterChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-gray-700"
            >
              <option value="all">All Years ({availableYears.length})</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y} PYQs</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Quick Select Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            Quick Presets:
          </span>
          <button
            onClick={() => onQuickSelect(10)}
            className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
          >
            First 10 Qs
          </button>
          <button
            onClick={() => onQuickSelect(15)}
            className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
          >
            First 15 Qs
          </button>
          <button
            onClick={() => onQuickSelect(25)}
            className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
          >
            First 25 Qs
          </button>
          <button
            onClick={() => onQuickSelect('2024')}
            className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition"
          >
            ⚡ 2024 PYQs Only
          </button>
          <button
            onClick={() => onQuickSelect('numerical')}
            className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition"
          >
            🔢 Numerical Only
          </button>
        </div>

        {/* Global Select / Deselect */}
        <div className="flex items-center gap-2">
          <button
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition"
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
