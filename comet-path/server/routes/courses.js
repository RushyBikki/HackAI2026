const express = require('express');
const router = express.Router();

const NEBULA_BASE = 'https://api.utdnebula.com';

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
    // NOTE: Adding limit/offset causes Nebula to return data:null — omit them
    const query =
      `/course?subject_prefix=${encodeURIComponent(parsed.subject_prefix)}` +
      `&course_number=${encodeURIComponent(parsed.course_number)}`;

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
    // NOTE: Nebula API returns data:null when limit/offset params are passed — use bare subject_prefix only
    const payload = await nebulaFetch(`/course?subject_prefix=${encodeURIComponent(prefix)}`);
    const courses = Array.isArray(payload?.data)
      ? payload.data
          .map(normalizeCourse)
          .filter(c => !c.course_number || parseInt(c.course_number, 10) < 5000)
      : [];
    res.json({ status: 200, data: courses });
  } catch (err) {
    console.error('[Course API] List error:', err.message);
    res.status(502).json({ status: 502, error: 'Failed to fetch courses from Nebula API.', detail: err.message });
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
    console.log(`[Grade API] ${req.params.courseId} -> Nebula returned:`, JSON.stringify(raw)?.slice(0, 200));

    if (!raw) {
      return res.json({ status: 200, data: [], course });
    }

    const labels = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'W'];
    const grade_distribution = {};

    if (Array.isArray(raw) && typeof raw[0] === 'number') {
      // Flat 14-element array of counts
      labels.forEach((label, i) => {
        if (raw[i] != null && raw[i] > 0) grade_distribution[label] = raw[i];
      });
    } else if (Array.isArray(raw) && raw[0]?.grade_distribution) {
      // Array of section objects, each with grade_distribution array or object
      for (const section of raw) {
        const dist = section.grade_distribution;
        if (Array.isArray(dist)) {
          labels.forEach((label, i) => {
            if (dist[i] != null && dist[i] > 0) grade_distribution[label] = (grade_distribution[label] || 0) + dist[i];
          });
        } else if (dist && typeof dist === 'object') {
          for (const [k, v] of Object.entries(dist)) {
            if (v > 0) grade_distribution[k] = (grade_distribution[k] || 0) + v;
          }
        }
      }
    }

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

    const rawProfs = Array.isArray(payload?.data) ? payload.data : [];
    const profs = rawProfs.map(p => ({
      ...p,
      name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.name || 'Unknown',
    }));

    res.json({
      status: 200,
      course,
      data: profs,
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