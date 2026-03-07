import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const NEBULA_BASE = process.env.NEBULA_BASE_URL || 'https://api.utdnebula.com';
const NEBULA_KEY = process.env.NEBULA_API_KEY;

async function nebula(path, searchParams) {
  const url = new URL(path, NEBULA_BASE);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(NEBULA_KEY ? { 'x-api-key': NEBULA_KEY } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Nebula error ${res.status}`);
  }

  return res.json();
}

function normalizeCourse(raw) {
  return {
    courseId: raw.courseId || raw.id || raw._id,
    name: raw.name || raw.title,
    description: raw.description || raw.longDescription || '',
    prefix: raw.prefix || raw.subject || '',
    creditHours: raw.creditHours || raw.credits || 3,
    prerequisites: raw.prerequisites || raw.prereq || raw.preReq || '',
  };
}

router.get('/courses', async (req, res) => {
  try {
    const prefix = req.query.prefix;
    const data = await nebula('/coursebook/courses', prefix ? { prefix } : undefined);
    const items = Array.isArray(data) ? data : data.items || [];
    res.json(items.map(normalizeCourse));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/courses', err);
    res.status(500).json({ error: 'Failed to fetch courses from Nebula.' });
  }
});

router.get('/course/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = await nebula(`/coursebook/courses/${encodeURIComponent(id)}`);
    res.json(normalizeCourse(data));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/course/:id', err);
    res.status(500).json({ error: 'Failed to fetch course details.' });
  }
});

router.get('/grades/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const data = await nebula(`/coursebook/grades/${encodeURIComponent(courseId)}`);
    res.json(data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/grades/:courseId', err);
    res.status(500).json({ error: 'Failed to fetch grade distribution.' });
  }
});

router.get('/professors/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const data = await nebula(`/coursebook/professors/${encodeURIComponent(courseId)}`);
    res.json(data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/professors/:courseId', err);
    res.status(500).json({ error: 'Failed to fetch professor data.' });
  }
});

export default router;

