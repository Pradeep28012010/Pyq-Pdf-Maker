const STORAGE_KEY = 'marks_app_auth_token';

export const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(STORAGE_KEY, token.trim());
    } catch (e) {
      console.error(e);
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  }
};

async function request(url, options = {}) {
  const token = tokenStorage.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }
  return data;
}

export const api = {
  verifyToken: async (token) => {
    const res = await request('/api/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    if (res.success) {
      tokenStorage.set(token);
    }
    return res;
  },

  getExams: async () => {
    return request('/api/exams');
  },

  getSubjects: async (examId) => {
    return request(`/api/exam/${examId}/subjects`);
  },

  getChapters: async (examId, subjectId) => {
    return request(`/api/exam/${examId}/subject/${subjectId}/chapters`);
  },

  getBuckets: async (examId, subjectId, chapterId) => {
    return request(`/api/exam/${examId}/subject/${subjectId}/chapter/${chapterId}/buckets`);
  },

  getBucketQuestions: async (examId, subjectId, chapterId, bucketId) => {
    return request(`/api/exam/${examId}/subject/${subjectId}/chapter/${chapterId}/bucket/${bucketId}/questions?limit=100`);
  },

  getQuestionsBatch: async (questionIds) => {
    return request('/api/questions/batch', {
      method: 'POST',
      body: JSON.stringify({ questionIds })
    });
  },

  getDemoData: async () => {
    return request('/api/demo-data');
  }
};
