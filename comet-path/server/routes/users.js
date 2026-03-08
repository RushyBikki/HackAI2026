const express = require('express');
const router = express.Router();
const { findUser, upsertUser } = require('../db');

// POST /api/users  — create or update user profile
router.post('/', async (req, res) => {
  try {
    const { name, major, completedCourses = [], plannedSemesters = [] } = req.body;
    if (!name || !major) return res.status(400).json({ error: 'name and major required' });
    const user = await upsertUser(name, { major, completedCourses, plannedSemesters, createdAt: new Date() });
    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:name  — retrieve saved profile
router.get('/:name', async (req, res) => {
  try {
    const user = await findUser({ name: req.params.name });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:name/plan  — update semester plan only
router.patch('/:name/plan', async (req, res) => {
  try {
    const { plannedSemesters } = req.body;
    const user = await findUser({ name: req.params.name });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await upsertUser(req.params.name, { ...user, plannedSemesters });
    res.json({ ok: true, user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
