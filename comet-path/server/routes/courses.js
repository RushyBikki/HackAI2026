const express = require('express');
const router = express.Router();

const NEBULA_BASE = 'https://api.utdnebula.com';

/**
 * Fetch from Nebula Labs API. All list endpoints are paginated with `offset`
 * (0-based; e.g. offset=16 returns page starting at the 17th item).
 * Set NEBULA_API_KEY in .env for authenticated access if required.
 * @see https://api.utdnebula.com/swagger/index.html
 */
async function nebulaFetch(pathAndSearch) {
  const url = `${NEBULA_BASE}${pathAndSearch}`;
  const headers = { Accept: 'application/json' };
  if (process.env.NEBULA_API_KEY) {
    headers['x-api-key'] = process.env.NEBULA_API_KEY;
  }
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (!res.ok) {
    console.error(`[Nebula API] ${res.status} ${url}`, data?.message || data);
    throw new Error(data?.message || `Nebula API ${res.status}`);
  }
  return data;
}

/** Default page size for paginated /course (API may cap this). */
const COURSE_PAGE_SIZE = 100;

/** Optional max total courses to return (env NEBULA_COURSE_LIMIT); 0 = no cap. */
const MAX_COURSES = Math.max(0, parseInt(process.env.NEBULA_COURSE_LIMIT, 10) || 0);

/**
 * GET /api/courses?prefix=CS
 * Returns all courses for a subject prefix. Nebula /course is paginated with offset;
 * we loop until we have all pages or hit NEBULA_COURSE_LIMIT.
 */
router.get('/', async (req, res) => {
  try {
    const prefix = req.query.prefix || 'CS';
    const all = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const path = `/course?subject_prefix=${encodeURIComponent(prefix)}&offset=${offset}`;
      const payload = await nebulaFetch(path);
      const page = Array.isArray(payload.data) ? payload.data : [];
      all.push(...page);
      if (MAX_COURSES > 0 && all.length >= MAX_COURSES) {
        all.length = MAX_COURSES;
        hasMore = false;
      } else if (page.length < COURSE_PAGE_SIZE) {
        hasMore = false;
      } else {
        offset += page.length;
      }
    }

    res.json({ status: 200, data: all });
  } catch (err) {
    console.error('[Course API] List error:', err.message);
    res.json({
      status: 200,
      message: 'Using mock data',
      data: [
        { _id: 'CS2305', subject_prefix: 'CS', course_number: '2305', title: 'Discrete Mathematics', credit_hours: '3' },
        { _id: 'CS2336', subject_prefix: 'CS', course_number: '2336', title: 'Computer Science II', credit_hours: '3' },
        { _id: 'CS3305', subject_prefix: 'CS', course_number: '3305', title: 'Data Structures', credit_hours: '3' },
        { _id: 'CS3345', subject_prefix: 'CS', course_number: '3345', title: 'Data Structures and Algorithms', credit_hours: '3' },
        { _id: 'CS3354', subject_prefix: 'CS', course_number: '3354', title: 'Software Engineering', credit_hours: '3' },
        { _id: 'CS3360', subject_prefix: 'CS', course_number: '3360', title: 'Computer Graphics', credit_hours: '3' },
        { _id: 'CS3377', subject_prefix: 'CS', course_number: '3377', title: 'C/C++ Programming in Unix', credit_hours: '3' },
      ],
    });
  }
});

/**
 * GET /api/courses/grades/:courseId
 * Nebula: GET /course/{id}/grades — returns overall grade distribution for that course.
 * Response data is array of integers (counts per grade bucket, order typically A,B,C,D,F).
 * We normalize to { data: [{ grade_distribution: { A, B, C, D, F } }] } for the client.
 */
router.get('/grades/:courseId', async (req, res) => {
  try {
    const id = req.params.courseId;
    const path = `/course/${encodeURIComponent(id)}/grades`;
    const payload = await nebulaFetch(path);
    const raw = payload.data;
    if (!Array.isArray(raw)) {
      return res.json({ status: 200, data: [] });
    }
    // Nebula returns array of ints; assume order A, B, C, D, F (or similar)
    const labels = ['A', 'B', 'C', 'D', 'F'];
    const grade_distribution = {};
    labels.forEach((label, i) => {
      if (raw[i] != null) grade_distribution[label] = raw[i];
    });
    res.json({
      status: 200,
      data: [{ grade_distribution }],
    });
  } catch (err) {
    console.error('[Grade API] Error:', err.message);
    res.json({
      status: 200,
      message: 'Using mock data',
      data: [{ grade_distribution: { A: 15, B: 10, C: 5, D: 2, F: 1 } }],
    });
  }
});

/**
 * GET /api/courses/professors/:courseId
 * Nebula: GET /course/{id}/professors — all professors for the course with given ID.
 */
router.get('/professors/:courseId', async (req, res) => {
  try {
    const id = req.params.courseId;
    const path = `/course/${encodeURIComponent(id)}/professors`;
    const data = await nebulaFetch(path);
    res.json(data);
  } catch (err) {
    console.error('[Professor API] Error:', err.message);
    res.json({
      status: 200,
      message: 'Using mock data',
      data: [
        { _id: 'prof1', first_name: 'John', last_name: 'Smith', email: 'jsmith@utdallas.edu' },
        { _id: 'prof2', first_name: 'Jane', last_name: 'Doe', email: 'jdoe@utdallas.edu' },
      ],
    });
  }
});

/**
 * GET /api/courses/:id
 * Nebula: GET /course/{id} — returns the course with given ID (e.g. CS2305).
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const path = `/course/${encodeURIComponent(id)}`;
    const data = await nebulaFetch(path);
    res.json(data);
  } catch (err) {
    console.error('[Course API] By-id error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
