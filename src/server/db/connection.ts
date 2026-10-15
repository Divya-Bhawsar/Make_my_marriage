// Make My Marriage — Mongoose Connection Manager for Serverless Runtimes

import mongoose from 'mongoose';
import { env } from '@/env';
import { logger } from '../logger';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseConnection ?? { conn: null, promise: null };
global.mongooseConnection = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    logger.info('Initializing new MongoDB connection pool...');

    cached.promise = mongoose.connect(env.DATABASE_URL, opts).then((mongooseInstance) => {
      logger.info('MongoDB connection established successfully');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    logger.error('Failed to establish MongoDB connection', err);
    throw err;
  }

  return cached.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    logger.info('MongoDB connection closed');
  }
}

export function getDatabaseConnectionState(): {
  readyState: number;
  description: string;
} {
  const state = mongoose.connection.readyState;
  const descriptions: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    readyState: state,
    description: descriptions[state] ?? 'unknown',
  };
}
