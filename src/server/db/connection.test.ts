import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectToDatabase, getDatabaseConnectionState } from './connection';

describe('Database Connection Manager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid initial connection state structure', () => {
    const state = getDatabaseConnectionState();
    expect(state).toHaveProperty('readyState');
    expect(state).toHaveProperty('description');
    expect(typeof state.readyState).toBe('number');
    expect(typeof state.description).toBe('string');
  });

  it('reuses existing connection promise when invoked concurrently', async () => {
    const mockMongoose = {} as typeof mongoose;
    const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(mockMongoose);

    // Call connectToDatabase concurrently
    const [conn1, conn2] = await Promise.all([connectToDatabase(), connectToDatabase()]);

    expect(conn1).toBe(mockMongoose);
    expect(conn2).toBe(mockMongoose);
    // Connect should only be invoked once due to promise caching
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });
});
