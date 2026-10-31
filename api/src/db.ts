import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || '';
const client = new MongoClient(uri);

// Explicitly type it so TS knows it starts empty
let db: Db | undefined;

export const connectDB = async () => {
  if (!uri) throw new Error('MONGO_URI is not defined in .env');
  try {
    await client.connect();
    db = client.db('continuum');
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const getDB = (): Db => {
  if (!db) throw new Error('Database not initialized. Call connectDB first.');
  return db;
};