const { MongoClient } = require('mongodb');

let db = null;
// In-memory fallback when no MongoDB URI is provided
const inMemory = { users: [] };

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[DB] No MONGODB_URI set - using in-memory store');
    return null;
  }
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db('cometpath');
  console.log('[DB] Connected to MongoDB Atlas');
  return db;
}

function getDB() {
  return db;
}

// Simple CRUD helpers that fall back to in-memory
async function findUser(query) {
  if (db) return db.collection('users').findOne(query);
  return inMemory.users.find(u =>
    Object.entries(query).every(([k, v]) => u[k] === v)
  ) || null;
}

async function upsertUser(name, data) {
  if (db) {
    // Strip _id and name from $set payload to avoid MongoDB errors
    const { _id, name: _name, ...safeData } = data;
    const result = await db.collection('users').findOneAndUpdate(
      { name },
      { $set: { ...safeData, updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
    return result;
  }
  const idx = inMemory.users.findIndex(u => u.name === name);
  const record = { ...data, name, updatedAt: new Date() };
  if (idx >= 0) inMemory.users[idx] = record;
  else inMemory.users.push(record);
  return record;
}

module.exports = { connectDB, getDB, findUser, upsertUser };
