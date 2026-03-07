import express from 'express';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from '../db.js';

const router = express.Router();

router.post('/users', async (req, res) => {
  try {
    const { _id, name, major, completedCourses = [], plannedSemesters = [] } = req.body || {};
    if (!name || !major) {
      return res.status(400).json({ error: 'name and major are required.' });
    }

    const users = await getUsersCollection();
    const now = new Date();
    const doc = {
      name,
      major,
      completedCourses,
      plannedSemesters,
      createdAt: now,
    };

    if (_id) {
      const result = await users.findOneAndUpdate(
        { _id: new ObjectId(_id) },
        { $set: doc },
        { returnDocument: 'after' },
      );
      return res.json(result || { ...doc, _id });
    }

    const result = await users.insertOne(doc);
    return res.json({ ...doc, _id: result.insertedId });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in POST /api/users', err);
    res.status(500).json({ error: 'Failed to save user profile.' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json(user);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in GET /api/users/:id', err);
    res.status(500).json({ error: 'Failed to load user profile.' });
  }
});

export default router;

