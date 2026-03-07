const BASE = '/api';

async function request(path, opts = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (networkErr) {
    throw new Error('Cannot reach server — make sure the backend is running on port 3001');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText || `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json().catch(() => {
    throw new Error('Server returned an invalid response');
  });
}

// Courses
export const getCourses = (prefix) => request(`/courses?prefix=${prefix}`);
export const getCourse = (id) => request(`/courses/${id}`);
export const getGrades = (courseId) => request(`/courses/grades/${courseId}`);
export const getProfessors = (courseId) => request(`/courses/professors/${courseId}`);

// Users
export const saveUser = (data) => request('/users', { method: 'POST', body: data });
export const getUser = (name) => request(`/users/${encodeURIComponent(name)}`);
export const updatePlan = (name, plannedSemesters) =>
  request(`/users/${encodeURIComponent(name)}/plan`, { method: 'PATCH', body: { plannedSemesters } });

// AI
export const getRecommendations = (data) => request('/ai/recommend', { method: 'POST', body: data });
export const getWhatIf = (data) => request('/ai/whatif', { method: 'POST', body: data });
export const getProfessorInsight = (data) => request('/ai/professor-insight', { method: 'POST', body: data });
