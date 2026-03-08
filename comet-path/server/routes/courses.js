const express = require('express');
const router = express.Router();

const NEBULA_BASE = 'https://api.utdnebula.com';
const COURSE_LIMIT = process.env.NEBULA_COURSE_LIMIT || 400;

function nebulaHeaders() {
  return {
    'x-api-key': process.env.NEBULA_API_KEY,
    'Accept': 'application/json',
  };
}

async function nebulaFetch(path) {
  const url = `${NEBULA_BASE}${path}`;
  const res = await fetch(url, { headers: nebulaHeaders() });
  if (!res.ok) throw new Error(`Nebula API ${res.status}: ${url}`);
  return res.json();
}

// GET /api/courses?prefix=CS  — courses by subject prefix
router.get('/', async (req, res) => {
  try {
    const { prefix = 'CS' } = req.query;
    const data = await nebulaFetch(`/course?subject_prefix=${prefix}&limit=${COURSE_LIMIT}`);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: err.message });
  }
});

// GET /api/courses/grades/:courseId  — grade distribution
// IMPORTANT: specific routes must be before /:id wildcard
router.get('/grades/:courseId', async (req, res) => {
  try {
    // Nebula grades endpoint uses subject+number
    const [prefix, number] = req.params.courseId.match(/([A-Z]+)(\d+)/).slice(1);
    const data = await nebulaFetch(`/grades?subject_prefix=${prefix}&course_number=${number}`);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: err.message });
  }
});

// GET /api/courses/professors/:courseId  — professors who taught a course
router.get('/professors/:courseId', async (req, res) => {
  try {
    const [prefix, number] = req.params.courseId.match(/([A-Z]+)(\d+)/).slice(1);
    const data = await nebulaFetch(`/grades?subject_prefix=${prefix}&course_number=${number}`);
    // Extract per-professor summary from grade data
    const byProf = {};
    if (data?.data) {
      for (const section of data.data) {
        const prof = section.instructor_name || 'Unknown';
        if (!byProf[prof]) byProf[prof] = { name: prof, sections: 0, gpa: 0, students: 0 };
        byProf[prof].sections++;
        byProf[prof].gpa += (section.grade_distribution?.average_gpa || 0);
        byProf[prof].students += (section.grade_distribution?.total || 0);
      }
      for (const p of Object.values(byProf)) {
        p.avgGpa = p.sections > 0 ? +(p.gpa / p.sections).toFixed(2) : null;
      }
    }
    res.json({ professors: Object.values(byProf) });
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: err.message });
  }
});

// GET /api/courses/:id  — single course detail (wildcard MUST come after specific routes)
router.get('/:id', async (req, res) => {
  try {
    const data = await nebulaFetch(`/course/${req.params.id}`);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
