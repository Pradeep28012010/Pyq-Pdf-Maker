import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import CategorySelector from './components/CategorySelector';
import QuestionFilterBar from './components/QuestionFilterBar';
import QuestionList from './components/QuestionList';
import PrintOptions from './components/PrintOptions';
import PrintableDocument from './components/PrintableDocument';
import LoginModal from './components/LoginModal';
import { api, tokenStorage } from './services/api';
import { downloadOfflineHtml } from './utils/exportHtml';
import { 
  Sparkles, 
  Printer, 
  FileText, 
  Download, 
  Leaf, 
  Clock, 
  CheckCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Hierarchy selections
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  // Questions data
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Search & Filters inside questions
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'singleCorrect' | 'numerical'
  const [yearFilter, setYearFilter] = useState('all');

  // Print options
  const [printOptions, setPrintOptions] = useState({
    layout: '2-column', // '2-column' | '1-column'
    fontSize: 'normal', // 'compact' | 'normal' | 'large'
    roughSpace: 'none',  // 'none' | 'small' | 'medium' | 'large'
    includeQuestions: true,
    includeAnswerKey: true,
    includeSolutions: true,
    includeOMR: false,   // Practice OMR Bubbles Sheet
    separateSections: false, // Default false: Continuous flow for maximum paper saving
    timeAllowed: '60 Mins',
    studentName: '',
    instituteName: '',
    showMetadata: true
  });

  // Demo data store
  const [demoDataStore, setDemoDataStore] = useState(null);

  // Initial load
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    const savedToken = tokenStorage.get();
    if (savedToken) {
      try {
        const res = await api.verifyToken(savedToken);
        if (res.success) {
          setUser(res.user);
          if (res.user?.name && !printOptions.studentName) {
            setPrintOptions(prev => ({ ...prev, studentName: res.user.name }));
          }
          setIsDemo(false);
          await loadExams();
          return;
        }
      } catch (e) {
        console.warn('Saved token expired or invalid:', e.message);
        tokenStorage.clear();
      }
    }

    // Default to demo mode if no valid token
    loadDemo();
  };

  const loadDemo = async () => {
    try {
      const res = await api.getDemoData();
      if (res.success) {
        setDemoDataStore(res.data);
        setIsDemo(true);
        setUser(null);

        setExams([res.data.exam]);
        setSelectedExam(res.data.exam);

        setSubjects([res.data.subject]);
        setSelectedSubject(res.data.subject);

        setChapters([res.data.chapter]);
        setSelectedChapter(res.data.chapter);

        setBuckets(res.data.buckets);
        const defaultBucket = res.data.buckets[0];
        setSelectedBucket(defaultBucket);

        const qs = res.data.questions[defaultBucket.id] || [];
        setAllQuestions(qs);
        setSelectedQuestionIds(new Set(qs.map(q => q._id)));
      }
    } catch (e) {
      console.error('Failed to load demo data:', e);
    }
  };

  const loadExams = async () => {
    try {
      const res = await api.getExams();
      if (res.success && res.exams.length > 0) {
        setExams(res.exams);
        const first = res.exams[0];
        setSelectedExam(first);
        loadSubjects(first.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSubjects = async (examId) => {
    setLoadingSubjects(true);
    setSubjects([]);
    setSelectedSubject(null);
    setChapters([]);
    setSelectedChapter(null);
    setBuckets([]);
    setSelectedBucket(null);
    setAllQuestions([]);
    setSelectedQuestionIds(new Set());

    try {
      const res = await api.getSubjects(examId);
      if (res.success && res.subjects.length > 0) {
        setSubjects(res.subjects);
        const firstSub = res.subjects[0];
        setSelectedSubject(firstSub);
        loadChapters(examId, firstSub.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadChapters = async (examId, subjectId) => {
    setLoadingChapters(true);
    setChapters([]);
    setSelectedChapter(null);
    setBuckets([]);
    setSelectedBucket(null);
    setAllQuestions([]);
    setSelectedQuestionIds(new Set());

    try {
      const res = await api.getChapters(examId, subjectId);
      if (res.success && res.chapters.length > 0) {
        setChapters(res.chapters);
        const firstCh = res.chapters[0];
        setSelectedChapter(firstCh);
        loadBuckets(examId, subjectId, firstCh.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChapters(false);
    }
  };

  const loadBuckets = async (examId, subjectId, chapterId) => {
    setLoadingBuckets(true);
    setBuckets([]);
    setSelectedBucket(null);
    setAllQuestions([]);
    setSelectedQuestionIds(new Set());

    try {
      const res = await api.getBuckets(examId, subjectId, chapterId);
      if (res.success && res.buckets.length > 0) {
        setBuckets(res.buckets);
        const firstBucket = res.buckets[0];
        setSelectedBucket(firstBucket);
        loadBucketQuestions(examId, subjectId, chapterId, firstBucket.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBuckets(false);
    }
  };

  const loadBucketQuestions = async (examId, subjectId, chapterId, bucketId) => {
    if (isDemo && demoDataStore) {
      const qs = demoDataStore.questions[bucketId] || [];
      setAllQuestions(qs);
      setSelectedQuestionIds(new Set(qs.map(q => q._id)));
      return;
    }

    setLoadingQuestions(true);
    setAllQuestions([]);
    setSelectedQuestionIds(new Set());
    setSearchTerm('');
    setTypeFilter('all');
    setYearFilter('all');

    try {
      const res = await api.getBucketQuestions(examId, subjectId, chapterId, bucketId);
      if (res.success) {
        const rawQs = res.questions || [];
        const questionIds = rawQs.map(q => q._id || q.id || q).filter(Boolean);

        if (questionIds.length > 0) {
          // If rawQs already has rich questions, use them directly, else batch fetch
          const hasDetails = rawQs[0] && typeof rawQs[0] === 'object' && (rawQs[0].question || rawQs[0].options);
          if (hasDetails) {
            setAllQuestions(rawQs);
            setSelectedQuestionIds(new Set(rawQs.map(q => q._id || q.id)));
          } else {
            const batchRes = await api.getQuestionsBatch(questionIds);
            if (batchRes.success) {
              setAllQuestions(batchRes.questions);
              setSelectedQuestionIds(new Set(batchRes.questions.map(q => q._id)));
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load bucket questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Extract available years from loaded questions
  const availableYears = useMemo(() => {
    const years = new Set();
    for (const q of allQuestions) {
      const title = q.previousYearPapers?.[0]?.title || '';
      const match = title.match(/20\d\d/);
      if (match) years.add(match[0]);
    }
    return Array.from(years).sort().reverse();
  }, [allQuestions]);

  // Compute filtered questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'numerical' && q.type !== 'numerical') return false;
        if (typeFilter === 'singleCorrect' && q.type !== 'singleCorrect') return false;
        if (typeFilter === 'multipleCorrect' && q.type !== 'multipleCorrect') return false;
      }

      // Year filter
      if (yearFilter !== 'all') {
        const title = q.previousYearPapers?.[0]?.title || '';
        if (!title.includes(yearFilter)) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const text = (q.question || q.statement || q.text || '').toLowerCase();
        const paper = (q.previousYearPapers?.[0]?.title || '').toLowerCase();
        const hint = (q.hint || '').toLowerCase();
        if (!text.includes(term) && !paper.includes(term) && !hint.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [allQuestions, typeFilter, yearFilter, searchTerm]);

  // Handlers for exam/subject/chapter/bucket
  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    if (!isDemo) loadSubjects(exam.id);
  };

  const handleSelectSubject = (sub) => {
    setSelectedSubject(sub);
    if (!isDemo && selectedExam) loadChapters(selectedExam.id, sub.id);
  };

  const handleSelectChapter = (ch) => {
    setSelectedChapter(ch);
    if (!isDemo && selectedExam && selectedSubject) {
      loadBuckets(selectedExam.id, selectedSubject.id, ch.id);
    }
  };

  const handleSelectBucket = (b) => {
    setSelectedBucket(b);
    if (selectedExam && selectedSubject && selectedChapter) {
      loadBucketQuestions(selectedExam.id, selectedSubject.id, selectedChapter.id, b.id);
    }
  };

  // Toggle selection
  const handleToggleQuestion = (id) => {
    const next = new Set(selectedQuestionIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedQuestionIds(next);
  };

  const handleSelectAll = () => {
    setSelectedQuestionIds(new Set(filteredQuestions.map(q => q._id || q.id)));
  };

  const handleDeselectAll = () => {
    setSelectedQuestionIds(new Set());
  };

  // Quick preset selections
  const handleQuickSelect = (preset) => {
    if (typeof preset === 'number') {
      const subset = filteredQuestions.slice(0, preset);
      setSelectedQuestionIds(new Set(subset.map(q => q._id || q.id)));
    } else if (preset === '2024') {
      const subset = allQuestions.filter(q => (q.previousYearPapers?.[0]?.title || '').includes('2024'));
      setSelectedQuestionIds(new Set(subset.map(q => q._id || q.id)));
      setYearFilter('2024');
    } else if (preset === 'numerical') {
      const subset = allQuestions.filter(q => q.type === 'numerical');
      setSelectedQuestionIds(new Set(subset.map(q => q._id || q.id)));
      setTypeFilter('numerical');
    }
  };

  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
    }, 450);
  };

  const handleDownloadHtml = () => {
    downloadOfflineHtml({
      questions: printableQuestions,
      exam: selectedExam,
      subject: selectedSubject,
      chapter: selectedChapter,
      bucket: selectedBucket,
      options: printOptions
    });
  };

  const handleLogout = () => {
    tokenStorage.clear();
    setUser(null);
    loadDemo();
  };

  // Questions selected for document
  const printableQuestions = useMemo(() => {
    return allQuestions.filter(q => selectedQuestionIds.has(q._id || q.id));
  }, [allQuestions, selectedQuestionIds]);

  // Paper & Time Estimation
  const estimatedPages = useMemo(() => {
    const qCount = printableQuestions.length;
    if (qCount === 0) return 0;
    // 2-column fits ~8 questions per sheet; 1-column fits ~4
    const qPerSheet = printOptions.layout === '2-column' ? 8 : 4;
    let pages = Math.ceil(qCount / qPerSheet);
    if (printOptions.includeAnswerKey) pages += 1;
    if (printOptions.includeSolutions) pages += Math.ceil(qCount / (printOptions.layout === '2-column' ? 6 : 3));
    return Math.max(1, pages);
  }, [printableQuestions, printOptions]);

  const estimatedTime = useMemo(() => {
    return Math.round(printableQuestions.length * 2.5);
  }, [printableQuestions]);

  return (
    <div className="min-h-screen bg-gray-50/70 text-gray-900 font-sans pb-24">
      {/* Top Navbar with Metrics & Actions */}
      <Navbar
        user={user}
        isDemo={isDemo}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onPrint={handlePrint}
        onDownloadHtml={handleDownloadHtml}
        selectedCount={selectedQuestionIds.size}
        isGenerating={isGenerating}
        estimatedPages={estimatedPages}
        estimatedTime={estimatedTime}
      />

      {/* Main Content Area */}
      <main className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200/40">
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Offline College Study Hours Mode</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Export MARKS Questions to Compact Paper Worksheets
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              No electronic devices allowed during offline study? Select your preferred category (<strong>Must Do</strong>, <strong>Most Relevant</strong>, <strong>Rank Boosters</strong>) and generate high-density 2-column worksheets with full LaTeX math, answer keys, and verified solutions at the end.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>2-Column Layout Saves 50% Paper</span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Includes Practice OMR Grid</span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-blue-300" />
              <span>Answer Key & Step-by-Step Solutions at End</span>
            </div>
          </div>
        </div>

        {/* Step 1: Exam, Subject, Chapter, Category Selector */}
        <CategorySelector
          exams={exams}
          subjects={subjects}
          chapters={chapters}
          buckets={buckets}
          selectedExam={selectedExam}
          selectedSubject={selectedSubject}
          selectedChapter={selectedChapter}
          selectedBucket={selectedBucket}
          onSelectExam={handleSelectExam}
          onSelectSubject={handleSelectSubject}
          onSelectChapter={handleSelectChapter}
          onSelectBucket={handleSelectBucket}
          loadingSubjects={loadingSubjects}
          loadingChapters={loadingChapters}
          loadingBuckets={loadingBuckets}
        />

        {/* Step 2: Print Customizer (Density, Layout, Sections, Rough Space) */}
        <PrintOptions
          options={printOptions}
          onChange={setPrintOptions}
          totalQuestions={allQuestions.length}
          selectedCount={selectedQuestionIds.size}
        />

        {/* Step 3: Question Filter Bar & Quick Selectors */}
        {allQuestions.length > 0 && (
          <QuestionFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
            availableYears={availableYears}
            totalCount={allQuestions.length}
            selectedCount={selectedQuestionIds.size}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onQuickSelect={handleQuickSelect}
          />
        )}

        {/* Step 4: Questions Preview & Selection List */}
        <QuestionList
          questions={filteredQuestions}
          selectedIds={selectedQuestionIds}
          onToggleSelect={handleToggleQuestion}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          loading={loadingQuestions}
        />

        {/* Step 5: Live Print Preview Sheet */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Live Paper Sheet Preview ({printableQuestions.length} Qs)
              </h3>
              <p className="text-xs text-gray-500">
                WYSIWYG layout — exactly how your printed A4 paper worksheet will look
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadHtml}
                disabled={printableQuestions.length === 0}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> Save Offline HTML
              </button>
              <button
                onClick={handlePrint}
                disabled={printableQuestions.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" /> Single-Click Print PDF
              </button>
            </div>
          </div>

          <div className="border border-gray-300 rounded-2xl overflow-hidden shadow-inner bg-gray-100/90 p-3 sm:p-8">
            <PrintableDocument
              questions={printableQuestions}
              exam={selectedExam}
              subject={selectedSubject}
              chapter={selectedChapter}
              bucket={selectedBucket}
              options={printOptions}
            />
          </div>
        </div>
      </main>

      {/* Floating Bottom Action Bar */}
      {selectedQuestionIds.size > 0 && (
        <div className="no-print fixed bottom-4 inset-x-4 max-w-3xl mx-auto z-40 bg-gray-950/90 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm">
              {selectedQuestionIds.size}
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2">
                <span>Questions Ready to Export</span>
                <span className="text-emerald-400 font-semibold">• ~{estimatedPages} {estimatedPages === 1 ? 'Sheet' : 'Sheets'}</span>
              </div>
              <p className="text-[10px] text-gray-400">
                {selectedChapter?.title} • {selectedBucket?.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* The Printable Document Component (Rendered strictly during @media print) */}
      <div className="print-only">
        <PrintableDocument
          questions={printableQuestions}
          exam={selectedExam}
          subject={selectedSubject}
          chapter={selectedChapter}
          bucket={selectedBucket}
          options={printOptions}
        />
      </div>

      {/* Login & Token Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(userData) => {
          setUser(userData);
          setIsDemo(false);
          loadExams();
        }}
        onSelectDemo={() => {
          loadDemo();
        }}
      />
    </div>
  );
}
