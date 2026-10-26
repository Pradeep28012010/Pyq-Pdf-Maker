import React, { useState } from 'react';
import { Star, Flame, Rocket, BookOpen, Search, Check, ChevronDown, Layers, X, PlusCircle, CheckSquare, Square } from 'lucide-react';

export default function CategorySelector({
  exams = [],
  subjects = [],
  chapters = [],
  buckets = [],
  selectedExam,
  selectedSubject,
  selectedChapter,
  selectedBucket,
  onSelectExam,
  onSelectSubject,
  onSelectChapter,
  onSelectBucket,
  selectedChapterIds = new Set(),
  onToggleChapterInBundle,
  isMultiChapter = false,
  onToggleMultiChapterMode,
  loadingSubjects,
  loadingChapters,
  loadingBuckets
}) {
  const [chapterSearch, setChapterSearch] = useState('');

  const filteredChapters = chapters.filter(ch =>
    (ch.title || '').toLowerCase().includes(chapterSearch.trim().toLowerCase())
  );

  const getBucketIcon = (title = '') => {
    const t = String(title || '').toLowerCase();
    if (t.includes('all')) return <Layers className="w-4 h-4 text-indigo-600 stroke-[2.5]" />;
    if (t.includes('must')) return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
    if (t.includes('relevant')) return <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />;
    if (t.includes('booster')) return <Rocket className="w-4 h-4 text-purple-500" />;
    if (t.includes('advanced')) return <Rocket className="w-4 h-4 text-rose-500" />;
    if (t.includes('numerical')) return <Star className="w-4 h-4 text-blue-500" />;
    return <BookOpen className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="no-print bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-5">
      {/* Step 1: Exam & Subject Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exam Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            1. Select Exam Target
          </label>
          <div className="flex flex-wrap gap-2">
            {exams.map(exam => {
              const active = selectedExam?.id === exam.id;
              return (
                <button
                  key={exam.id}
                  onClick={() => onSelectExam(exam)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200 font-bold'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  {exam.title}
                  {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            2. Select Subject
          </label>
          <div className="flex flex-wrap gap-2">
            {loadingSubjects ? (
              <div className="h-8 flex items-center gap-2 text-xs text-gray-400">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Loading subjects...
              </div>
            ) : subjects.length > 0 ? (
              subjects.map(sub => {
                const active = selectedSubject?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onSelectSubject(sub)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200 font-bold'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    {sub.title}
                    {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-gray-400">Choose an exam first</span>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Chapter Selection */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              3. Select Chapter {chapters.length > 0 && `(${filteredChapters.length} of ${chapters.length})`}
            </label>

            {/* Multi-Chapter Mode Toggle */}
            {onToggleMultiChapterMode && chapters.length > 0 && (
              <button
                type="button"
                onClick={onToggleMultiChapterMode}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                  isMultiChapter
                    ? 'bg-purple-100 border-purple-300 text-purple-900'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <PlusCircle className="w-3 h-3 text-purple-600" />
                <span>{isMultiChapter ? 'Multi-Unit Bundle (Active)' : 'Combine Multiple Chapters'}</span>
              </button>
            )}
          </div>

          <div className="relative w-48 sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chapters (e.g. straight lines, thermodynamics)..."
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {chapterSearch && (
              <button
                onClick={() => setChapterSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {loadingChapters ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading chapters from MARKS App...</span>
          </div>
        ) : filteredChapters.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {filteredChapters.map(ch => {
              const active = isMultiChapter
                ? selectedChapterIds.has(ch.id)
                : selectedChapter?.id === ch.id;

              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    if (isMultiChapter && onToggleChapterInBundle) {
                      onToggleChapterInBundle(ch);
                    } else {
                      onSelectChapter(ch);
                    }
                  }}
                  className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between cursor-pointer ${
                    active
                      ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-950 font-semibold shadow-2xs'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="text-xs leading-snug line-clamp-2">{ch.title}</div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                    <span>{ch.totalQuestions ? `${ch.totalQuestions} Qs` : ''}</span>
                    {active && <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-400 space-y-1">
            <p>No chapters matching "{chapterSearch}"</p>
            {chapterSearch && (
              <button
                onClick={() => setChapterSearch('')}
                className="text-indigo-600 font-semibold underline text-[11px]"
              >
                Clear search filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Category / Bucket Selection (Must Do, Most Relevant, Rank Boosters) */}
      <div className="border-t border-gray-100 pt-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" />
          4. Select Category Bucket (Must Do, Most Relevant, Rank Boosters)
        </label>

        {loadingBuckets ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Fetching question categories from MARKS App...
          </div>
        ) : buckets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {buckets.map(b => {
              const active = selectedBucket?.id === b.id;
              const isAll = b.id === 'all-pyqs' || b.isAll || (b.title || '').toLowerCase().includes('all');

              return (
                <button
                  key={b.id}
                  onClick={() => onSelectBucket(b)}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-3 relative cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                      : isAll
                      ? 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/70'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${active ? 'bg-indigo-100 text-indigo-900' : isAll ? 'bg-indigo-100/70 text-indigo-700' : 'bg-gray-100'}`}>
                    {getBucketIcon(b.title)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold block truncate ${active ? 'text-indigo-900' : 'text-gray-800'}`}>
                        {b.title}
                      </span>
                      {isAll && (
                        <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-indigo-200/80 text-indigo-900">
                          Complete
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 block">
                      {b.totalQuestions ? `${b.totalQuestions} Questions` : 'All Questions'}
                    </span>
                  </div>
                  {active && (
                    <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Select a chapter above to see category buckets</p>
        )}
      </div>
    </div>
  );
}
