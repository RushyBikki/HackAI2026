const express = require('express');
const router = express.Router();

const NEBULA_BASE = 'https://api.utdnebula.com';
const PAGE_SIZE = Number(process.env.NEBULA_PAGE_SIZE || 100);
const MAX_COURSES = Math.max(0, parseInt(process.env.NEBULA_COURSE_LIMIT || '0', 10));

async function nebulaFetch(pathAndSearch) {
  const url = `${NEBULA_BASE}${pathAndSearch}`;
  const headers = {
    Accept: 'application/json',
  };

  if (process.env.NEBULA_API_KEY) {
    headers['x-api-key'] = process.env.NEBULA_API_KEY;
  }

  const res = await fetch(url, { headers });

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(`Nebula returned non-JSON response: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    console.error(`[Nebula API] ${res.status} ${url}`, data);
    throw new Error(data?.message || `Nebula API ${res.status}`);
  }

  return data;
}

function normalizeCourse(course) {
  if (!course || typeof course !== 'object') return course;

  const titles = Array.isArray(course.titles) ? course.titles : [];
  const bestTitle = titles.find(Boolean) || course.title || '';

  return {
    ...course,
    courseId:
      course.courseId ||
      `${course.subject_prefix || ''}${course.course_number || ''}`.trim(),
    title: bestTitle,
    titles,
  };
}

function parseCourseCode(raw) {
  const s = String(raw || '').toUpperCase().replace(/[\s-]/g, '');
  const match = s.match(/^([A-Z]{2,4})(\d{4})$/);
  if (!match) return null;

  return {
    subject_prefix: match[1],
    course_number: match[2],
  };
}

async function resolveCourse(identifier) {
  const parsed = parseCourseCode(identifier);

  if (parsed) {
    const query =
      `/course?subject_prefix=${encodeURIComponent(parsed.subject_prefix)}` +
      `&course_number=${encodeURIComponent(parsed.course_number)}` +
      `&offset=0&limit=10`;

    const payload = await nebulaFetch(query);
    const items = Array.isArray(payload?.data) ? payload.data : [];

    if (items.length > 0) {
      return normalizeCourse(items[0]);
    }
  }

  const payload = await nebulaFetch(`/course/${encodeURIComponent(identifier)}`);
  const direct = payload?.data ?? payload;
  return normalizeCourse(direct);
}

/**
 * GET /api/courses?prefix=CS
 */
router.get('/', async (req, res) => {
  try {
    const prefix = String(req.query.prefix || 'CS').toUpperCase().trim();
    const all = [];
    let offset = 0;

    while (true) {
      const path =
        `/course?subject_prefix=${encodeURIComponent(prefix)}` +
        `&offset=${offset}&limit=${PAGE_SIZE}`;

      const payload = await nebulaFetch(path);
      const pageRaw = Array.isArray(payload?.data) ? payload.data : [];
      const page = pageRaw.map(normalizeCourse);

      all.push(...page);

      if (MAX_COURSES > 0 && all.length >= MAX_COURSES) {
        return res.json({ status: 200, data: all.slice(0, MAX_COURSES) });
      }

      if (page.length === 0 || page.length < PAGE_SIZE) {
        break;
      }

      offset += page.length;
    }

    res.json({ status: 200, data: all });
  } catch (err) {
    console.error('[Course API] List error:', err.message);
    res.status(502).json({
      status: 502,
      error: 'Failed to fetch courses from Nebula API.',
      detail: err.message,
    });
  }
});

/**
 * GET /api/courses/grades/:courseId
 */
router.get('/grades/:courseId', async (req, res) => {
  try {
    const course = await resolveCourse(req.params.courseId);
    const nebulaId = course?._id || course?.id;

    if (!nebulaId) {
      return res.status(404).json({ error: 'Course not found in Nebula.' });
    }

    const payload = await nebulaFetch(`/course/${encodeURIComponent(nebulaId)}/grades`);
    const raw = payload?.data;

    if (!Array.isArray(raw)) {
      return res.json({
        status: 200,
        data: [],
        course,
      });
    }

    const labels = ['A', 'B', 'C', 'D', 'F'];
    const grade_distribution = {};

    labels.forEach((label, i) => {
      if (raw[i] != null) grade_distribution[label] = raw[i];
    });

    res.json({
      status: 200,
      course,
      data: [{ grade_distribution }],
    });
  } catch (err) {
    console.error('[Grade API] Error:', err.message);
    res.status(502).json({
      error: 'Failed to fetch grade data from Nebula API.',
      detail: err.message,
    });
  }
});

/**
 * GET /api/courses/professors/:courseId
 */
router.get('/professors/:courseId', async (req, res) => {
  try {
    const course = await resolveCourse(req.params.courseId);
    const nebulaId = course?._id || course?.id;

    if (!nebulaId) {
      return res.status(404).json({ error: 'Course not found in Nebula.' });
    }

    const payload = await nebulaFetch(`/course/${encodeURIComponent(nebulaId)}/professors`);

    res.json({
      status: 200,
      course,
      data: Array.isArray(payload?.data) ? payload.data : payload,
    });
  } catch (err) {
    console.error('[Professor API] Error:', err.message);
    res.status(502).json({
      error: 'Failed to fetch professor data from Nebula API.',
      detail: err.message,
    });
  }
});

/**
 * GET /api/courses/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const course = await resolveCourse(req.params.id);
    res.json({ status: 200, data: course });
  } catch (err) {
    console.error('[Course API] By-id error:', err.message);
    res.status(502).json({
      error: 'Failed to fetch course from Nebula API.',
      detail: err.message,
    });
  }
});

module.exports = router;