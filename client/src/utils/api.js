const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with ${res.status}`);
  }

  return res.json().catch(() => null);
}

export const api = {
  async fetchCourses({ prefix, signal } = {}) {
    const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    return request(`/api/courses${params}`, { signal });
  },

  async fetchCourse(id) {
    return request(`/api/course/${encodeURIComponent(id)}`);
  },

  async fetchGrades(courseId) {
    return request(`/api/grades/${encodeURIComponent(courseId)}`);
  },

  async fetchProfessors(courseId) {
    return request(`/api/professors/${encodeURIComponent(courseId)}`);
  },

  async saveUserProfile(profile) {
    return request('/api/users', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  async loadUserProfile(id) {
    return request(`/api/users/${encodeURIComponent(id)}`);
  },

  async recommendCourses(payload) {
    return request('/api/ai/recommend', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async whatIfMajor(payload) {
    return request('/api/ai/whatif', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

