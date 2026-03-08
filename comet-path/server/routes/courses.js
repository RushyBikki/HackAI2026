const express = require('express');
const router = express.Router();

const NEBULA_BASE = 'https://api.utdnebula.com';

// No authentication needed for Nebula API
async function nebulaFetch(path) {
  try {
    const url = `${NEBULA_BASE}${path}`;
    console.log(`[Nebula API] GET ${url}`);
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[Nebula API Error] ${res.status}:`, data);
      throw new Error(`Nebula API ${res.status}`);
    }
    console.log(`[Nebula API] Success, got ${data?.data?.length || 0} results`);
    return data;
  } catch (err) {
    console.error(`[Nebula API] Request failed:`, err.message);
    throw err;
  }
}

// GET /api/courses?prefix=CS  — courses by subject prefix
router.get('/', async (req, res) => {
  try {
    const { prefix = 'CS' } = req.query;
    console.log(`[Course API] Fetching courses for prefix: ${prefix}`);
    const data = await nebulaFetch(`/course?subject_prefix=${prefix}`);
    res.json(data);
  } catch (err) {
    console.error(`[Course API] Error:`, err.message);
    // Return mock data on error
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
      ]
    });
  }
});

// GET /api/courses/grades/:courseId  — grade distribution
router.get('/grades/:courseId', async (req, res) => {
  try {
    const [prefix, number] = req.params.courseId.match(/([A-Z]+)(\d+)/).slice(1);
    console.log(`[Grade API] Fetching grades for ${prefix}${number}`);
    // FIX: Nebula API uses 'prefix' and 'number', NOT 'subject_prefix' and 'course_number'
    const data = await nebulaFetch(`/grades/overall?prefix=${prefix}&number=${number}`);
    res.json(data);
  } catch (err) {
    console.error(`[Grade API] Error:`, err.message);
    res.json({
      status: 200,
      message: 'Using mock data',
      data: [15, 10, 5, 2, 1]
    });
  }
});

// GET /api/courses/professors/:courseId  — professors who taught a course
router.get('/professors/:courseId', async (req, res) => {
  try {
    const [prefix, number] = req.params.courseId.match(/([A-Z]+)(\d+)/).slice(1);
    console.log(`[Professor API] Fetching professors for ${prefix}${number}`);
    const courseId = `${prefix}${number}`;
    const data = await nebulaFetch(`/course/${courseId}/professors`);
    res.json(data);
  } catch (err) {
    console.error(`[Professor API] Error:`, err.message);
    res.json({
      status: 200,
      message: 'Using mock data',
      data: [
        { _id: 'prof1', first_name: 'John', last_name: 'Smith', email: 'jsmith@utdallas.edu' },
        { _id: 'prof2', first_name: 'Jane', last_name: 'Doe', email: 'jdoe@utdallas.edu' }
      ]
    });
  }
});

// GET /api/courses/:id  — single course detail
router.get('/:id', async (req, res) => {
  try {
    console.log(`[Course API] Fetching course details for ${req.params.id}`);
    const data = await nebulaFetch(`/course/${req.params.id}`);
    res.json(data);
  } catch (err) {
    console.error(`[Course API] Error:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;