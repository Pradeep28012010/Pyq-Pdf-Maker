import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import CategorySelector from './components/CategorySelector';
import QuestionFilterBar from './components/QuestionFilterBar';
import QuestionList from './components/QuestionList';
import PrintOptions from './components/PrintOptions';
import PrintableDocument from './components/PrintableDocument';
import LoginModal from './components/LoginModal';
import { api, tokenStorage } from './services/api';
import { downloadOfflineHtml } from './utils/exportHtml';
import bundledDemoData from './demo_data.json';
import { 
  Sparkles, 
  Printer, 
  FileText, 
  Download, 
  Leaf, 
  Clock, 
  CheckCircle
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
  const [chapterMasterQuestions, setChapterMasterQuestions] = useState([]); // Master copy of all chapter questions
  const chapterMasterRef = useRef([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Search & Filters inside questions
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'singleCorrect' | 'numerical'
  const [yearFilter, setYearFilter] = useState('all');
  const [selectedYears, setSelectedYears] = useState(new Set()); // Multi-year filter
  const [difficultyFilter, setDifficultyFilter] = useState('all'); // 'all' | 'easy' | 'medium' | 'hard'
  const [sessionFilter, setSessionFilter] = useState('all'); // 'all' | 'jan' | 'apr'
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100); // 80 | 100 | 115

  // Multi-chapter bundling
  const [isMultiChapter, setIsMultiChapter] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState(new Set());

  // Starred questions persistence in localStorage
  const [starredQuestionIds, setStarredQuestionIds] = useState(() => {
    try {
      const saved = localStorage.getItem('marks_starred_questions');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handleToggleStar = (id) => {
    setStarredQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('marks_starred_questions', JSON.stringify([...next]));
      } catch {
        // Ignore localStorage quota errors
      }
      return next;
    });
  };

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

  const applyDemoData = (data) => {
    if (!data) return;
    setDemoDataStore(data);
    setIsDemo(true);
    setUser(null);

    if (data.exam) {
      setExams([data.exam]);
      setSelectedExam(data.exam);
    }
    if (data.subject) {
      setSubjects([data.subject]);
      setSelectedSubject(data.subject);
    }
    if (data.chapter) {
      setChapters([data.chapter]);
      setSelectedChapter(data.chapter);
    }
    if (data.buckets && data.buckets.length > 0) {
      // Gather all demo questions across all buckets
      const allDemoQs = [];
      const seenIds = new Set();
      Object.values(data.questions || {}).forEach(arr => {
        if (Array.isArray(arr)) {
          arr.forEach(q => {
            const id = q._id || q.id;
            if (id && !seenIds.has(id)) {
              seenIds.add(id);
              allDemoQs.push(q);
            }
          });
        }
      });

      // Provide "All PYQs" as the very first bucket option
      const allPyqsBucket = {
        id: 'all-pyqs',
        title: 'All PYQs',
        totalQuestions: allDemoQs.length,
        isAll: true
      };

      const finalBuckets = [allPyqsBucket, ...data.buckets.filter(b => b.id !== 'all-pyqs')];
      setBuckets(finalBuckets);
      setSelectedBucket(allPyqsBucket);
      setAllQuestions(allDemoQs);
      setSelectedQuestionIds(new Set(allDemoQs.map(q => q._id)));
    }
  };

  const loadDemo = async () => {
    // 1. Immediately apply bundled data so questions display with zero blank screen!
    applyDemoData(bundledDemoData);

    // 2. Also attempt to sync from server if available
    try {
      const res = await api.getDemoData();
      if (res.success && res.data) {
        applyDemoData(res.data);
      }
    } catch (err) {
      console.warn('API demo fetch failed; using bundled demo questions:', err?.message || err);
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
    } catch (err) {
      console.error(err);
    }
  };

  // Initial load
  useEffect(() => {
    async function start() {
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
        } catch (err) {
          console.warn('Saved token expired or invalid:', err?.message || err);
          tokenStorage.clear();
        }
      }

      // Default to demo mode if no valid token
      loadDemo();
    }
    start();
  }, []);

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

  const STANDARD_MARKS_BUCKETS = useMemo(() => [
    { id: 'all-pyqs', title: 'All PYQs', slug: 'all-pyqs', isAll: true },
    { id: 'most-relevant', title: 'Most Relevant PYQ-based Qs', slug: 'most-relevant' },
    { id: 'must-do', title: 'Must Do Qs of last 5 Years', slug: 'must-do' },
    { id: 'rank-boosters', title: 'Rank Booster', slug: 'rank-boosters' },
    { id: 'top-numerical', title: 'Top Numerical', slug: 'top-numerical' },
    { id: 'advanced', title: 'Advanced Questions', slug: 'advanced' },
    { id: 'beginner', title: 'Beginner Qs', slug: 'beginner' }
  ], []);

  // Compute live question counts across standard buckets
  const calculateBucketCounts = (qs, currentBuckets) => {
    if (!Array.isArray(qs) || qs.length === 0) return currentBuckets;
    return currentBuckets.map(b => {
      let count = b.totalQuestions || 0;
      if (b.id === 'all-pyqs' || b.isAll) {
        count = qs.length;
      } else if (b.id === 'top-numerical') {
        count = qs.filter(q => q.type === 'numerical').length;
      } else if (b.id === 'must-do') {
        const matching = qs.filter(q => {
          const title = q.previousYearPapers?.[0]?.title || '';
          const match = title.match(/20\d\d/);
          return match && parseInt(match[0]) >= 2020;
        });
        count = matching.length > 0 ? matching.length : Math.min(25, qs.length);
      } else if (b.id === 'most-relevant') {
        const matching = qs.filter(q => {
          const title = q.previousYearPapers?.[0]?.title || '';
          return title.includes('2024') || title.includes('2023') || title.includes('2022');
        });
        count = matching.length > 0 ? matching.length : Math.min(20, qs.length);
      } else if (b.id === 'rank-boosters' || b.id === 'advanced') {
        const matching = qs.filter(q => {
          const diff = String(q.difficulty ?? q.level ?? '').toLowerCase();
          const paper = (q.previousYearPapers?.[0]?.title || '').toLowerCase();
          return diff.includes('hard') || diff === '3' || paper.includes('advanced');
        });
        count = matching.length > 0 ? matching.length : Math.min(15, qs.length);
      } else if (b.id === 'beginner') {
        const matching = qs.filter(q => {
          const diff = String(q.difficulty ?? q.level ?? '').toLowerCase();
          return diff.includes('easy') || diff === '1' || q.type === 'singleCorrect';
        });
        count = matching.length > 0 ? matching.length : Math.min(15, qs.length);
      }
      return { ...b, totalQuestions: count };
    });
  };

  const loadBuckets = async (examId, subjectId, chapterId) => {
    setLoadingBuckets(true);
    setBuckets([]);
    setSelectedBucket(null);
    setAllQuestions([]);
    setChapterMasterQuestions([]);
    chapterMasterRef.current = [];
    setSelectedQuestionIds(new Set());

    try {
      const res = await api.getBuckets(examId, subjectId, chapterId);
      const serverBuckets = (res.success && Array.isArray(res.buckets)) ? res.buckets : [];

      // Combine server buckets with standard MARKS buckets to ensure all buckets are always loaded
      const combined = [...serverBuckets];
      for (const std of STANDARD_MARKS_BUCKETS) {
        if (!combined.some(b => b.id === std.id || (b.title || '').toLowerCase() === std.title.toLowerCase())) {
          combined.push({ ...std });
        }
      }

      setBuckets(combined);
      const defaultBucket = combined.find(b => b.id === 'all-pyqs') || combined[0];
      setSelectedBucket(defaultBucket);
      loadBucketQuestions(examId, subjectId, chapterId, defaultBucket.id, combined);
    } catch (e) {
      console.warn('Using standard MARKS buckets fallback:', e);
      setBuckets(STANDARD_MARKS_BUCKETS);
      const defaultBucket = STANDARD_MARKS_BUCKETS[0];
      setSelectedBucket(defaultBucket);
      loadBucketQuestions(examId, subjectId, chapterId, defaultBucket.id, STANDARD_MARKS_BUCKETS);
    } finally {
      setLoadingBuckets(false);
    }
  };

  const loadBucketQuestions = async (examId, subjectId, chapterId, bucketId, bucketList = buckets) => {
    if (isDemo && demoDataStore) {
      if (bucketId === 'all-pyqs') {
        const allDemoQs = [];
        const seenIds = new Set();
        Object.values(demoDataStore.questions || {}).forEach(arr => {
          if (Array.isArray(arr)) {
            arr.forEach(q => {
              const id = q._id || q.id;
              if (id && !seenIds.has(id)) {
                seenIds.add(id);
                allDemoQs.push(q);
              }
            });
          }
        });
        setAllQuestions(allDemoQs);
        setChapterMasterQuestions(allDemoQs);
        chapterMasterRef.current = allDemoQs;
        setSelectedQuestionIds(new Set(allDemoQs.map(q => q._id)));
        setBuckets(prev => calculateBucketCounts(allDemoQs, prev));
      } else {
        const qs = demoDataStore.questions[bucketId] || [];
        setAllQuestions(qs);
        setSelectedQuestionIds(new Set(qs.map(q => q._id)));
      }
      return;
    }

    setLoadingQuestions(true);
    setAllQuestions([]);
    setSelectedQuestionIds(new Set());
    setSearchTerm('');
    setTypeFilter('all');
    setYearFilter('all');
    setSelectedYears(new Set());

    try {
      if (bucketId === 'all-pyqs') {
        // Try direct all-pyqs fetch
        let questions = [];
        try {
          const res = await api.getBucketQuestions(examId, subjectId, chapterId, 'all-pyqs');
          if (res.success && res.questions && res.questions.length > 0) {
            questions = res.questions;
          }
        } catch (e) {
          console.warn('Direct all-pyqs fetch failed, aggregating across buckets:', e.message);
        }

        // If direct fetch didn't return questions, aggregate across all regular buckets
        if (questions.length === 0) {
          const regularBuckets = (bucketList || []).filter(b => b.id !== 'all-pyqs');
          const promises = regularBuckets.map(b => api.getBucketQuestions(examId, subjectId, chapterId, b.id).catch(() => null));
          const responses = await Promise.all(promises);

          const uniqueMap = new Map();
          for (const r of responses) {
            if (r && r.success && Array.isArray(r.questions)) {
              for (const q of r.questions) {
                const id = q._id || q.id || (typeof q === 'string' ? q : null);
                if (id && !uniqueMap.has(id)) {
                  uniqueMap.set(id, q);
                }
              }
            }
          }
          questions = Array.from(uniqueMap.values());
        }

        const questionIds = questions.map(q => q._id || q.id || q).filter(Boolean);
        if (questionIds.length > 0) {
          const hasDetails = questions[0] && typeof questions[0] === 'object' && (questions[0].question || questions[0].options);
          if (hasDetails) {
            setAllQuestions(questions);
            setChapterMasterQuestions(questions);
            chapterMasterRef.current = questions;
            setSelectedQuestionIds(new Set(questions.map(q => q._id || q.id)));
            setBuckets(prev => calculateBucketCounts(questions, prev));
          } else {
            const batchRes = await api.getQuestionsBatch(questionIds);
            if (batchRes.success) {
              setAllQuestions(batchRes.questions);
              setChapterMasterQuestions(batchRes.questions);
              chapterMasterRef.current = batchRes.questions;
              setSelectedQuestionIds(new Set(batchRes.questions.map(q => q._id)));
              setBuckets(prev => calculateBucketCounts(batchRes.questions, prev));
            }
          }
        }
      } else {
        let loadedQs = [];
        try {
          const res = await api.getBucketQuestions(examId, subjectId, chapterId, bucketId);
          if (res && res.success && Array.isArray(res.questions) && res.questions.length > 0) {
            const rawQs = res.questions;
            const questionIds = rawQs.map(q => q._id || q.id || q).filter(Boolean);

            if (questionIds.length > 0) {
              const hasDetails = rawQs[0] && typeof rawQs[0] === 'object' && (rawQs[0].question || rawQs[0].options);
              if (hasDetails) {
                loadedQs = rawQs;
              } else {
                const batchRes = await api.getQuestionsBatch(questionIds);
                if (batchRes && batchRes.success && Array.isArray(batchRes.questions)) {
                  loadedQs = batchRes.questions;
                }
              }
            }
          }
        } catch (e) {
          console.warn(`Server bucket questions failed for ${bucketId}, falling back to chapter master:`, e.message);
        }

        // Fallback to chapterMasterQuestions if server returned 0 questions
        const masterPool = chapterMasterRef.current.length > 0 ? chapterMasterRef.current : chapterMasterQuestions;
        if (loadedQs.length === 0 && masterPool.length > 0) {
          if (bucketId === 'top-numerical') {
            loadedQs = masterPool.filter(q => q.type === 'numerical');
          } else if (bucketId === 'must-do') {
            loadedQs = masterPool.filter(q => {
              const title = q.previousYearPapers?.[0]?.title || '';
              const match = title.match(/20\d\d/);
              return match && parseInt(match[0], 10) >= 2020;
            });
            if (loadedQs.length === 0) loadedQs = masterPool.slice(0, 30);
          } else if (bucketId === 'most-relevant') {
            loadedQs = masterPool.filter(q => {
              const title = q.previousYearPapers?.[0]?.title || '';
              return title.includes('2024') || title.includes('2023') || title.includes('2022') || title.includes('2021');
            });
            if (loadedQs.length === 0) loadedQs = masterPool.slice(0, 25);
          } else if (bucketId === 'rank-boosters' || bucketId === 'advanced') {
            loadedQs = masterPool.filter(q => {
              const diff = String(q.difficulty ?? q.level ?? '').toLowerCase();
              const paper = (q.previousYearPapers?.[0]?.title || '').toLowerCase();
              return diff.includes('hard') || diff === '3' || paper.includes('advanced') || (q.accuracy && q.accuracy < 45);
            });
            if (loadedQs.length === 0) loadedQs = masterPool.slice(0, 20);
          } else if (bucketId === 'beginner') {
            loadedQs = masterPool.filter(q => {
              const diff = String(q.difficulty ?? q.level ?? '').toLowerCase();
              return diff.includes('easy') || diff === '1' || q.type === 'singleCorrect' || (q.accuracy && q.accuracy >= 60);
            });
            if (loadedQs.length === 0) loadedQs = masterPool.slice(0, 20);
          } else {
            loadedQs = masterPool;
          }
        }

        if (loadedQs.length > 0) {
          setAllQuestions(loadedQs);
          setSelectedQuestionIds(new Set(loadedQs.map(q => q._id || q.id)));
        }
      }
    } catch (e) {
      console.error('Failed to load bucket questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Extract available years with counts from loaded questions
  const availableYearsWithCount = useMemo(() => {
    const counts = {};
    for (const q of allQuestions) {
      const title = q.previousYearPapers?.[0]?.title || '';
      const match = title.match(/20\d\d/);
      if (match) {
        const y = match[0];
        counts[y] = (counts[y] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [allQuestions]);

  const availableYears = useMemo(() => {
    return availableYearsWithCount.map(item => item.year);
  }, [availableYearsWithCount]);

  // Compute filtered questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      const qId = q._id || q.id;

      // Starred filter
      if (onlyStarred && !starredQuestionIds.has(qId)) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'numerical' && q.type !== 'numerical') return false;
        if (typeFilter === 'singleCorrect' && q.type !== 'singleCorrect') return false;
        if (typeFilter === 'multipleCorrect' && q.type !== 'multipleCorrect') return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all') {
        const diff = String(q.difficulty ?? q.level ?? '').toLowerCase();
        const isEasy = diff.includes('easy') || diff === '1' || (q.accuracy && q.accuracy >= 65);
        const isHard = diff.includes('hard') || diff === '3' || (q.accuracy && q.accuracy < 40);
        const isMedium = diff.includes('med') || diff === '2' || (!isEasy && !isHard);

        if (difficultyFilter === 'easy' && !isEasy) return false;
        if (difficultyFilter === 'medium' && !isMedium) return false;
        if (difficultyFilter === 'hard' && !isHard) return false;
      }

      // Particular Year(s) filter
      if (selectedYears.size > 0) {
        const title = q.previousYearPapers?.[0]?.title || '';
        const match = title.match(/20\d\d/);
        const qYear = match ? match[0] : null;
        if (!qYear || !selectedYears.has(qYear)) {
          return false;
        }
      } else if (yearFilter !== 'all') {
        const title = q.previousYearPapers?.[0]?.title || '';
        if (!title.includes(yearFilter)) return false;
      }

      // Session filter (Jan vs Apr shift)
      if (sessionFilter !== 'all') {
        const title = (q.previousYearPapers?.[0]?.title || '').toLowerCase();
        if (sessionFilter === 'jan' && !title.includes('jan')) return false;
        if (sessionFilter === 'apr' && !title.includes('apr')) return false;
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
  }, [allQuestions, typeFilter, yearFilter, selectedYears, searchTerm, difficultyFilter, sessionFilter, onlyStarred, starredQuestionIds]);

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

    // Instant client-side filtering if master question pool exists
    const masterPool = chapterMasterRef.current.length > 0 ? chapterMasterRef.current : chapterMasterQuestions;
    if (masterPool.length > 0) {
      if (b.id === 'all-pyqs') {
        setAllQuestions(masterPool);
        setSelectedQuestionIds(new Set(masterPool.map(q => q._id || q.id)));
      } else {
        let filtered = [];
        if (b.id === 'top-numerical') {
          filtered = masterPool.filter(q => q.type === 'numerical');
        } else if (b.id === 'must-do') {
          filtered = masterPool.filter(q => {
            const title = q.previousYearPapers?.[0]?.title || '';
            const match = title.match(/20\d\d/);
            return match && parseInt(match[0], 10) >= 2020;
          });
          if (filtered.length === 0) filtered = masterPool.slice(0, 30);
        } else if (b.id === 'most-relevant') {
          filtered = masterPool.filter(q => {
            const title = q.previousYearPapers?.[0]?.title || '';
            return title.includes('2024') || title.includes('2023') || title.includes('2022') || title.includes('2021');
          });
          if (filtered.length === 0) filtered = masterPool.slice(0, 25);
        } else if (b.id === 'rank-boosters' || b.id === 'advanced') {
          filtered = masterPool.filter(q => {
            const diff = String(q.difficulty ?? q.level ?? '').toLowerCase();
            const paper = (q.previousYearPapers?.[0]?.title || '').toLowerCase();
            return diff.includes('hard') || diff === '3' || paper.includes('advanced') || (q.accuracy && q.accuracy < 45);
          });
          if (filtered.length === 0) filtered = masterPool.slice(0, 20);
        } else if (b.id === 'beginner') {
          filtered = masterPool.filter(q => {
            const diff = String(q.difficulty ?? q.level ?? '').toLowerCase();
            return diff.includes('easy') || diff === '1' || q.type === 'singleCorrect' || (q.accuracy && q.accuracy >= 60);
          });
          if (filtered.length === 0) filtered = masterPool.slice(0, 20);
        } else {
          filtered = masterPool;
        }

        if (filtered.length > 0) {
          setAllQuestions(filtered);
          setSelectedQuestionIds(new Set(filtered.map(q => q._id || q.id)));
        }
      }
    }

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

  // Year filter handlers
  const handleToggleYear = (year) => {
    setSelectedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const handleSelectAllYears = () => {
    setSelectedYears(new Set());
    setYearFilter('all');
  };

  const handleSelectLastNYears = (n = 5) => {
    const topYears = availableYearsWithCount.slice(0, n).map(y => y.year);
    setSelectedYears(new Set(topYears));
  };

  const handleSelectVisibleQuestions = () => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      filteredQuestions.forEach(q => {
        next.add(q._id || q.id);
      });
      return next;
    });
  };

  // Multi-chapter bundle handlers
  const handleToggleMultiChapterMode = () => {
    setIsMultiChapter(prev => {
      const nextVal = !prev;
      if (nextVal && selectedChapter) {
        setSelectedChapterIds(new Set([selectedChapter.id]));
      } else {
        setSelectedChapterIds(new Set());
      }
      return nextVal;
    });
  };

  const handleToggleChapterInBundle = async (ch) => {
    const next = new Set(selectedChapterIds);
    if (next.has(ch.id)) {
      next.delete(ch.id);
    } else {
      next.add(ch.id);
    }
    setSelectedChapterIds(next);

    // If demo mode
    if (isDemo && demoDataStore) {
      const qs = demoDataStore.questions?.[selectedBucket?.id || 'bucket-1'] || [];
      setAllQuestions(qs);
      setSelectedQuestionIds(new Set(qs.map(q => q._id)));
      return;
    }

    // Live mode: fetch questions across selected chapters
    if (selectedExam && selectedSubject && selectedBucket && next.size > 0) {
      setLoadingQuestions(true);
      try {
        let combined = [];
        for (const chId of next) {
          const res = await api.getBucketQuestions(selectedExam.id, selectedSubject.id, chId, selectedBucket.id);
          if (res.success && res.questions) {
            combined.push(...res.questions);
          }
        }
        // Deduplicate
        const uniqueMap = new Map();
        combined.forEach(q => {
          const id = q._id || q.id;
          if (id && !uniqueMap.has(id)) uniqueMap.set(id, q);
        });
        const uniqueList = Array.from(uniqueMap.values());
        setAllQuestions(uniqueList);
        setSelectedQuestionIds(new Set(uniqueList.map(q => q._id || q.id)));
      } catch (e) {
        console.error('Failed to bundle chapters:', e);
      } finally {
        setLoadingQuestions(false);
      }
    }
  };

  // Quick preset selections
  const handleQuickSelect = (preset) => {
    if (preset === 'nta-pattern') {
      // Pick up to 20 MCQs and up to 5 Numerical Qs as per official NTA JEE Main pattern
      const mcqs = filteredQuestions.filter(q => q.type !== 'numerical').slice(0, 20);
      const nums = filteredQuestions.filter(q => q.type === 'numerical').slice(0, 5);
      const combined = [...mcqs, ...nums];
      setSelectedQuestionIds(new Set(combined.map(q => q._id || q.id)));
    } else if (preset === 'starred') {
      const starredSubset = filteredQuestions.filter(q => starredQuestionIds.has(q._id || q.id));
      setSelectedQuestionIds(new Set(starredSubset.map(q => q._id || q.id)));
    } else if (typeof preset === 'number') {
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

  // Shuffle questions order for realistic exam drill
  const handleShuffle = () => {
    setAllQuestions(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
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
    <div className="min-h-screen relative text-slate-900 font-sans pb-28">
      {/* Ambient Fluid Mesh Gradient Backdrop */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-sky-300/25 via-blue-200/15 to-transparent blur-3xl animate-fluid-1" />
        <div className="absolute top-[20%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-purple-300/20 via-indigo-200/15 to-transparent blur-3xl animate-fluid-2" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-amber-200/15 via-teal-200/10 to-transparent blur-3xl animate-fluid-3" />
      </div>

      {/* Top Floating Navbar with Metrics & Actions */}
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
      <main className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Apple Pure Liquid Glass Hero Card */}
        <div className="relative overflow-hidden glass-panel-elevated rounded-3xl p-6 sm:p-8 transition-all duration-300">
          <div className="relative z-10 max-w-3xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-xs font-bold backdrop-blur-md border border-[#0071e3]/20 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Offline College Study Hours Mode</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Export MARKS Questions to High-Density Study Worksheets
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              No electronic devices permitted during study sessions? Choose your target question bucket (<strong className="text-slate-900">Must Do</strong>, <strong className="text-slate-900">Most Relevant</strong>, <strong className="text-slate-900">Rank Boosters</strong>) and generate compact 2-column paper worksheets with full KaTeX mathematical notation, instant answer keys, and step-by-step solutions at the end.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>2-Column Layout Saves 50% Paper</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Includes Practice OMR Grid</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <CheckCircle className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Answer Key & Verified Solutions at End</span>
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
          selectedChapterIds={selectedChapterIds}
          onToggleChapterInBundle={handleToggleChapterInBundle}
          isMultiChapter={isMultiChapter}
          onToggleMultiChapterMode={handleToggleMultiChapterMode}
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
            availableYearsWithCount={availableYearsWithCount}
            selectedYears={selectedYears}
            onToggleYear={handleToggleYear}
            onSelectAllYears={handleSelectAllYears}
            onSelectLastNYears={handleSelectLastNYears}
            onSelectVisibleQuestions={handleSelectVisibleQuestions}
            filteredCount={filteredQuestions.length}
            difficultyFilter={difficultyFilter}
            onDifficultyFilterChange={setDifficultyFilter}
            sessionFilter={sessionFilter}
            onSessionFilterChange={setSessionFilter}
            onlyStarred={onlyStarred}
            onToggleStarredOnly={() => setOnlyStarred(!onlyStarred)}
            starredCount={starredQuestionIds.size}
            totalCount={allQuestions.length}
            selectedCount={selectedQuestionIds.size}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onQuickSelect={handleQuickSelect}
            onShuffle={handleShuffle}
          />
        )}

        {/* Step 4: Questions Preview & Selection List */}
        <QuestionList
          questions={filteredQuestions}
          selectedIds={selectedQuestionIds}
          starredIds={starredQuestionIds}
          onToggleSelect={handleToggleQuestion}
          onToggleStar={handleToggleStar}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          loading={loadingQuestions}
        />

        {/* Step 5: Live Document Studio (Presentation Easel & Realistic Elevated A4 Paper) */}
        <div className="glass-panel-elevated rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Live Document Studio</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200/60 text-slate-700 font-semibold">
                    {printableQuestions.length} Qs
                  </span>
                  {estimatedPages > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 font-semibold border border-emerald-500/20 hidden sm:inline-flex items-center gap-1">
                      <Leaf className="w-3 h-3 text-emerald-600" />
                      ~{estimatedPages} {estimatedPages === 1 ? 'Sheet' : 'Sheets'}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  WYSIWYG layout presentation easel — exactly how your printed A4 paper worksheet will look
                </p>
              </div>
            </div>
            
            {/* Studio Clean Sheet Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sheet Zoom Control */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-200/50 backdrop-blur-md p-1 rounded-full border border-white/60 text-xs font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
                <span className="text-[10px] text-slate-500 uppercase px-2 font-bold">Zoom</span>
                {[80, 100, 115].map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setPreviewZoom(z)}
                    className={`px-2.5 py-0.5 rounded-full text-xs transition cursor-pointer ${
                      previewZoom === z ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {z}%
                  </button>
                ))}
              </div>

              <button
                onClick={handleDownloadHtml}
                disabled={printableQuestions.length === 0}
                className="px-4 py-2 bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold rounded-full border border-white/80 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" /> Save Offline HTML
              </button>
              <button
                onClick={handlePrint}
                disabled={printableQuestions.length === 0}
                className="px-5 py-2 glass-btn-emerald text-white text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" /> Single-Click Print PDF
              </button>
            </div>
          </div>

          {/* Presentation Easel Container */}
          <div className="bg-gradient-to-b from-slate-200/60 via-slate-100/50 to-slate-200/60 backdrop-blur-2xl rounded-3xl p-4 sm:p-8 border border-white/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] flex justify-center overflow-x-auto min-h-[300px] items-center">
            {printableQuestions.length === 0 ? (
              <div className="w-full max-w-md glass-panel rounded-3xl p-8 text-center space-y-3.5 my-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center mx-auto shadow-2xs">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">No Questions Selected for Document</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select questions individually above, or click an exam preset to preview your printable worksheet.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect('nta-pattern')}
                    className="px-4 py-1.5 rounded-full glass-btn-primary text-white text-xs font-bold cursor-pointer"
                  >
                    Load NTA Mock (25 Qs)
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-4 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold border border-slate-200/80 cursor-pointer shadow-2xs"
                  >
                    Select All Questions ({allQuestions.length})
                  </button>
                </div>
              </div>
            ) : (
              /* Realistic Elevated Paper Sheet with Physical Stacking Illusion */
              <div 
                style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
                className="w-full max-w-4xl paper-sheet-stacked rounded-md overflow-hidden transition-transform duration-200"
              >
                <PrintableDocument
                  id="printable-area-preview"
                  questions={printableQuestions}
                  exam={selectedExam}
                  subject={selectedSubject}
                  chapter={selectedChapter}
                  bucket={selectedBucket}
                  options={printOptions}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Bottom Action Capsule Dock */}
      {selectedQuestionIds.size > 0 && (
        <div className="no-print fixed bottom-5 inset-x-3 sm:inset-x-6 max-w-2xl mx-auto z-40 glass-dock text-white py-2.5 px-4 sm:px-6 rounded-full flex items-center justify-between gap-3 sm:gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0071e3] flex items-center justify-center font-bold text-xs text-white shadow-[0_0_12px_rgba(0,113,227,0.6)] shrink-0">
              {selectedQuestionIds.size}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold flex items-center gap-2 truncate">
                <span>Questions Ready to Export</span>
                <span className="text-emerald-400 font-semibold">• ~{estimatedPages} {estimatedPages === 1 ? 'Sheet' : 'Sheets'}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {selectedChapter?.title || 'Selected Chapter'} • {selectedBucket?.title || 'Category'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="px-5 py-2 glass-btn-emerald text-white font-bold text-xs sm:text-sm rounded-full flex items-center gap-2 cursor-pointer"
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
          id="printable-area"
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
