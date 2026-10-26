const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

const MARKS_BASE = 'https://production.getmarks.app';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function getClient(token) {
  return axios.create({
    baseURL: MARKS_BASE,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    timeout: 15000
  });
}

// In-memory cache for questions
const questionCache = new Map();

// Map of human readable slugs / names to official MARKS MongoDB ObjectIDs
const EXAM_ID_MAP = {
  'jee-main': '615f0e999476412f48314daf',
  'jee-advanced': '616059150283de43c87e3e21',
  'bitsat': '61a8a124e8ce0dc8a5c62d2c',
  'wbjee': '61961adca5a5260118868013',
  'mht-cet': '61c05599e8ce0dc8a5c62d32',
  'kcet': '62962075e7f8e9ac4daeafda',
  'nta-abhyas': '616059af0283de43c87e3e23',
  'nda': '61961abda5a5260118868012',
  'cbse-12': '6943ebc753e4e1880190efca'
};

function resolveExamId(id) {
  if (!id) return '615f0e999476412f48314daf';
  return EXAM_ID_MAP[id.toLowerCase()] || id;
}

// Load demo data safely
let demoData = null;
try {
  demoData = require('./demo_data.json');
} catch (e) {
  try {
    demoData = require('../demo_data.json');
  } catch (err) {
    console.warn('Could not load demo_data.json:', err.message);
  }
}

// Create express router
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// Verify user token and get profile
router.post('/verify-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

  try {
    const client = getClient(token);
    const response = await client.get('/api/v4/user/me');
    const userData = response.data?.data?.user;

    return res.json({
      success: true,
      user: {
        id: userData?._id,
        name: userData?.name || 'Marks Student',
        email: userData?.email || '',
        phone: userData?.phone || '',
        isPremium: Boolean(userData?.isPremium || userData?.isSubscribed),
        premiumModules: userData?.premiumModules || [],
        targetYear: userData?.targetYear?.title || '',
        examCategory: userData?.examCategory || 'JEE',
        avatar: userData?.avatar || ''
      }
    });
  } catch (err) {
    console.error('Token verification error:', err.response?.data || err.message);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Get Exams list
router.get('/exams', async (req, res) => {
  const exams = [
    { id: '615f0e999476412f48314daf', slug: 'jee-main', title: 'JEE Main', category: 'Engineering' },
    { id: '616059150283de43c87e3e21', slug: 'jee-advanced', title: 'JEE Advanced', category: 'Engineering' },
    { id: '61a8a124e8ce0dc8a5c62d2c', slug: 'bitsat', title: 'BITSAT', category: 'Engineering' },
    { id: '61961adca5a5260118868013', slug: 'wbjee', title: 'WBJEE', category: 'Engineering' },
    { id: '61c05599e8ce0dc8a5c62d32', slug: 'mht-cet', title: 'MHT CET', category: 'Engineering' },
    { id: '6943ebc753e4e1880190efca', slug: 'cbse-12', title: 'CBSE Class 12', category: 'Boards' }
  ];

  return res.json({ success: true, exams });
});

// Get subjects for an exam
router.get('/exam/:examId/subjects', async (req, res) => {
  const rawExamId = req.params.examId;
  const examId = resolveExamId(rawExamId);
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });

  const client = getClient(token);
  console.log(`Fetching subjects for examId: ${examId}`);

  try {
    const response = await client.get(`/api/v4/cpyqb/exam/${examId}?platform=web`);
    const examData = response.data?.data;
    const rawSubjects = examData?.subjects || [];
    
    console.log(`Successfully fetched ${rawSubjects.length} subjects for ${examData?.title || examId}`);

    const subjects = rawSubjects.map(s => ({
      id: s.id || s._id,
      title: s.title || s.name,
      icon: s.icon,
      totalQuestions: s.totalQuestions || 0,
      chaptersCount: s.chaptersCount || 0
    }));

    return res.json({
      success: true,
      examTitle: examData?.title || rawExamId,
      examId,
      subjects
    });
  } catch (err) {
    console.error(`Failed to fetch subjects for ${examId}:`, err.response?.data || err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch subjects from Marks App' });
  }
});

// Get chapters for an exam and subject
router.get('/exam/:examId/subject/:subjectId/chapters', async (req, res) => {
  const examId = resolveExamId(req.params.examId);
  const { subjectId } = req.params;
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });

  const client = getClient(token);
  console.log(`Fetching chapters for exam ${examId}, subject ${subjectId}`);

  try {
    const response = await client.get(`/api/v4/cpyqb/exam/${examId}/subject/${subjectId}?search=&platform=web&limit=100&offset=0`);
    const data = response.data?.data;

    const rawChapters = Array.isArray(data?.chapters)
      ? data.chapters
      : Array.isArray(data?.chapters?.data)
        ? data.chapters.data
        : [];

    console.log(`Successfully fetched ${rawChapters.length} chapters!`);

    const chapters = rawChapters.map(ch => ({
      id: ch._id || ch.id,
      title: ch.title,
      totalQuestions: ch.totalQuestions || 0,
      order: ch.order || 0
    }));

    return res.json({
      success: true,
      subjectTitle: data?.subject?.title || subjectId,
      chapters
    });
  } catch (err) {
    console.error('Error fetching chapters:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch chapters' });
  }
});

// Get buckets for a chapter
router.get('/exam/:examId/subject/:subjectId/chapter/:chapterId/buckets', async (req, res) => {
  const examId = resolveExamId(req.params.examId);
  const { subjectId, chapterId } = req.params;
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });

  const client = getClient(token);
  console.log(`Fetching buckets for chapter: ${chapterId}`);

  try {
    const response = await client.get(`/api/v4/cpyqb/exam/${examId}/subject/${subjectId}/chapter/${chapterId}/buckets`);
    const data = response.data?.data;

    let buckets = [];
    if (Array.isArray(data?.buckets)) {
      buckets = data.buckets;
    } else if (Array.isArray(data)) {
      buckets = data;
    } else if (data && typeof data === 'object') {
      buckets = Object.values(data).filter(b => typeof b === 'object' && (b.title || b.name));
    }

    const formattedBuckets = buckets.map(b => ({
      id: b.id || b._id,
      title: b.title || b.name,
      totalQuestions: b.totalQuestions || 0,
      slug: b.slug
    }));

    // Ensure 'All PYQs' bucket is present at the front
    const hasAll = formattedBuckets.some(b => (b.title || '').toLowerCase().includes('all') || b.id === 'all-pyqs');
    if (!hasAll) {
      formattedBuckets.unshift({
        id: 'all-pyqs',
        title: 'All PYQs',
        totalQuestions: data?.chapter?.totalQuestions || data?.totalQuestions || 0,
        slug: 'all-pyqs',
        isAll: true
      });
    }

    return res.json({
      success: true,
      chapterTitle: data?.chapter?.title || chapterId,
      buckets: formattedBuckets
    });
  } catch (err) {
    console.error('Error fetching buckets:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch buckets' });
  }
});

// Get questions in a bucket (supports 'all-pyqs')
router.get('/exam/:examId/subject/:subjectId/chapter/:chapterId/bucket/:bucketId/questions', async (req, res) => {
  const examId = resolveExamId(req.params.examId);
  const { subjectId, chapterId, bucketId } = req.params;
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });

  const client = getClient(token);
  console.log(`Fetching questions for chapter: ${chapterId}, bucket: ${bucketId}`);

  try {
    // If 'all-pyqs' requested, attempt direct chapter endpoint or aggregate across buckets
    if (bucketId === 'all-pyqs' || bucketId === 'all') {
      try {
        const url = `/api/v4/cpyqb/exam/${examId}/subject/${subjectId}/chapter/${chapterId}/questions?limit=250&offset=0&platform=web`;
        const response = await client.get(url);
        const data = response.data?.data;
        const questions = Array.isArray(data?.questions)
          ? data.questions
          : Array.isArray(data?.questions?.data)
            ? data.questions.data
            : [];

        if (questions.length > 0) {
          console.log(`Directly fetched ${questions.length} questions for All PYQs`);
          return res.json({
            success: true,
            total: data?.total || questions.length,
            questions
          });
        }
      } catch (e) {
        console.log('Chapter questions endpoint not directly accessible; aggregating across buckets');
      }

      // Aggregate across all buckets for this chapter
      const bRes = await client.get(`/api/v4/cpyqb/exam/${examId}/subject/${subjectId}/chapter/${chapterId}/buckets`);
      const bData = bRes.data?.data;
      let rawBuckets = Array.isArray(bData?.buckets) ? bData.buckets : Array.isArray(bData) ? bData : [];
      const bucketIds = rawBuckets.map(b => b.id || b._id).filter(Boolean);

      const uniqueMap = new Map();
      for (const bId of bucketIds) {
        try {
          const qRes = await client.get(`/api/v4/cpyqb/exam/${examId}/subject/${subjectId}/chapter/${chapterId}/bucket/${bId}/questions?limit=100&offset=0&platform=web`);
          const qs = Array.isArray(qRes.data?.data?.questions) ? qRes.data.data.questions : [];
          for (const q of qs) {
            const id = q._id || q.id || (typeof q === 'string' ? q : null);
            if (id && !uniqueMap.has(id)) {
              uniqueMap.set(id, q);
            }
          }
        } catch (err) {
          // continue to next bucket
        }
      }

      const combinedQuestions = Array.from(uniqueMap.values());
      console.log(`Aggregated ${combinedQuestions.length} unique questions for All PYQs`);
      return res.json({
        success: true,
        total: combinedQuestions.length,
        questions: combinedQuestions
      });
    }

    const url = `/api/v4/cpyqb/exam/${examId}/subject/${subjectId}/chapter/${chapterId}/bucket/${bucketId}/questions?limit=100&offset=0&platform=web`;
    const response = await client.get(url);
    const data = response.data?.data;

    const questions = Array.isArray(data?.questions)
      ? data.questions
      : Array.isArray(data?.questions?.data)
        ? data.questions.data
        : [];

    console.log(`Fetched ${questions.length} questions for bucket ${bucketId}`);

    return res.json({
      success: true,
      total: data?.total || questions.length,
      questions
    });
  } catch (err) {
    console.error('Error fetching bucket questions:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch bucket questions' });
  }
});

// Batch fetch full question details (with solutions & answer keys)
router.post('/questions/batch', async (req, res) => {
  const { questionIds } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });

  const client = getClient(token);
  const results = [];
  const uncachedIds = [];

  for (const qid of questionIds) {
    if (questionCache.has(qid)) {
      results.push(questionCache.get(qid));
    } else {
      uncachedIds.push(qid);
    }
  }

  const CHUNK_SIZE = 5;
  for (let i = 0; i < uncachedIds.length; i += CHUNK_SIZE) {
    const chunk = uncachedIds.slice(i, i + CHUNK_SIZE);
    const promises = chunk.map(async (qid) => {
      try {
        const qRes = await client.get(`/api/v4/questions/${qid}`);
        const qData = qRes.data?.data?.question;
        if (qData) {
          questionCache.set(qid, qData);
          return qData;
        }
      } catch (e) {
        console.warn(`Failed to fetch detail for ${qid}`);
        return null;
      }
    });

    const chunkResults = await Promise.all(promises);
    for (const item of chunkResults) {
      if (item) results.push(item);
    }
  }

  return res.json({
    success: true,
    total: results.length,
    questions: results
  });
});

// Image proxy
router.get('/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL required');
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
    });
    res.set('Content-Type', response.headers['content-type'] || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(response.data));
  } catch (err) {
    return res.status(404).send('Image failed');
  }
});

// Demo Data
router.get('/demo-data', (req, res) => {
  if (demoData) {
    return res.json({ success: true, data: demoData });
  }
  return res.status(404).json({ success: false, error: 'Demo data not available' });
});

// Mount router under BOTH /api and / to handle all Vercel rewrite behaviors
app.use('/api', router);
app.use('/', router);

module.exports = app;
