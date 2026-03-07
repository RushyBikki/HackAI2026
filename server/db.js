import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  // eslint-disable-next-line no-console
  console.warn('[CometPath] MONGODB_URI is not set. Backend will run without persistence.');
}

let client;
let db;

export async function getDb() {
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
}

export async function getUsersCollection() {
  const database = await getDb();
  return database.collection('users');
}

