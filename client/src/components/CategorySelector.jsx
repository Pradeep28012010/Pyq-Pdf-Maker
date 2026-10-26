import React, { useState } from 'react';
import { Star, Flame, Rocket, BookOpen, Search, Check, Layers, X, PlusCircle } from 'lucide-react';

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
    if (t.includes('all')) return <Layers className="w-4 h-4 text-[#0071e3] stroke-[2.5]" />;
    if (t.includes('must')) return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
    if (t.includes('relevant')) return <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />;
    if (t.includes('booster')) return <Rocket className="w-4 h-4 text-purple-500" />;
    if (t.includes('advanced')) return <Rocket className="w-4 h-4 text-rose-500" />;
    if (t.includes('numerical')) return <Star className="w-4 h-4 text-[#0071e3]" />;
    if (t.includes('beginner')) return <BookOpen className="w-4 h-4 text-emerald-500" />;
    return <BookOpen className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="no-print glass-panel rounded-3xl p-6 transition-all duration-300 space-y-5">
      {/* Step 1: Exam & Subject Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Exam Selection */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Target Exam</span>
            </label>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {exams.map(exam => {
              const active = selectedExam?.id === exam.id;
              return (
                <button
                  key={exam.id}
                  onClick={() => onSelectExam(exam)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'glass-btn-primary text-white shadow-[0_4px_12px_rgba(0,113,227,0.3)] font-bold'
                      : 'bg-white/60 hover:bg-white/90 text-slate-700 border border-white/80 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <span>{exam.title}</span>
                  {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Selection */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Subject</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {loadingSubjects ? (
              <div className="h-8 flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3.5 h-3.5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                <span>Loading subjects...</span>
              </div>
            ) : subjects.length > 0 ? (
              subjects.map(sub => {
                const active = selectedSubject?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onSelectSubject(sub)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] font-bold'
                        : 'bg-white/60 hover:bg-white/90 text-slate-700 border border-white/80 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <span>{sub.title}</span>
                    {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-400">Choose an exam first</span>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Chapter Selection */}
      <div className="border-t border-slate-200/50 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Select Chapter</span>
              {chapters.length > 0 && (
                <span className="text-slate-400 font-normal">({filteredChapters.length} of {chapters.length})</span>
              )}
            </label>

            {/* Multi-Chapter Mode Toggle */}
            {onToggleMultiChapterMode && chapters.length > 0 && (
              <button
                type="button"
                onClick={onToggleMultiChapterMode}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isMultiChapter
                    ? 'bg-purple-500/15 border-purple-400 text-purple-900 shadow-xs'
                    : 'bg-slate-200/40 hover:bg-slate-200/70 border-white/60 text-slate-600'
                }`}
              >
                <PlusCircle className={`w-3.5 h-3.5 ${isMultiChapter ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>{isMultiChapter ? 'Multi-Unit Bundle Active' : 'Bundle Multiple Chapters'}</span>
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chapters (e.g. kinematics, limits)..."
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all shadow-2xs"
            />
            {chapterSearch && (
              <button
                onClick={() => setChapterSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {loadingChapters ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
            <div className="w-5 h-5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            <span>Loading chapters from MARKS App...</span>
          </div>
        ) : filteredChapters.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
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
                  className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    active
                      ? 'bg-blue-50/90 border-[#0071e3] ring-1 ring-[#0071e3] text-blue-950 font-bold shadow-xs'
                      : 'bg-white hover:bg-blue-50/30 border-slate-200/90 hover:border-[#0071e3]/60 text-slate-800 font-medium shadow-2xs hover:scale-[1.01]'
                  }`}
                >
                  <div className="text-xs leading-snug line-clamp-2">{ch.title}</div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                    <span>{ch.totalQuestions ? `${ch.totalQuestions} Qs` : ''}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#0071e3] stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 space-y-1">
            <p>No chapters matching "{chapterSearch}"</p>
            {chapterSearch && (
              <button
                onClick={() => setChapterSearch('')}
                className="text-[#0071e3] font-semibold underline text-[11px] cursor-pointer"
              >
                Clear search filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Category / Bucket Selection (Must Do, Most Relevant, Rank Boosters) */}
      <div className="border-t border-slate-200/50 pt-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center text-[10px] font-bold">4</span>
          <span>Select Question Category Bucket</span>
        </label>

        {loadingBuckets ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            <span>Fetching question categories from MARKS App...</span>
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
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 relative cursor-pointer ${
                    active
                      ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-[#0071e3] shadow-sm ring-1 ring-[#0071e3]'
                      : isAll
                      ? 'bg-blue-50/50 border-blue-300 hover:border-[#0071e3] hover:bg-blue-50/80 shadow-2xs'
                      : 'bg-white hover:bg-blue-50/30 border-slate-200/90 hover:border-[#0071e3]/60 shadow-2xs hover:scale-[1.01]'
                  }`}
                >
                  <div className={`p-2 rounded-xl backdrop-blur-sm ${
                    active 
                      ? 'bg-[#0071e3]/15 text-[#0071e3]' 
                      : isAll 
                      ? 'bg-blue-100/70 text-[#0071e3]' 
                      : 'bg-slate-100/80 text-slate-600'
                  }`}>
                    {getBucketIcon(b.title)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold block truncate ${active ? 'text-blue-950' : 'text-slate-800'}`}>
                        {b.title}
                      </span>
                      {isAll && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                          Complete
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {b.totalQuestions ? `${b.totalQuestions} Questions` : 'All Questions'}
                    </span>
                  </div>
                  {active && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0071e3] shrink-0 shadow-[0_0_8px_rgba(0,113,227,0.6)]" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Select a chapter above to see category buckets</p>
        )}
      </div>
    </div>
  );
}
