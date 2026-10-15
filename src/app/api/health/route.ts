// Make My Marriage — Health & Operational Readiness API

import { NextResponse } from 'next/server';
import { connectToDatabase, getDatabaseConnectionState } from '@/server/db/connection';
import { handleApiError } from '@/shared/errors/error-handler';
import { env } from '@/env';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let dbStatus = getDatabaseConnectionState();

    // Attempt connection if not already connected
    if (dbStatus.readyState !== 1) {
      try {
        await connectToDatabase();
        dbStatus = getDatabaseConnectionState();
      } catch {
        // We still return health info with database status indication
        dbStatus = getDatabaseConnectionState();
      }
    }

    return NextResponse.json({
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        environment: env.NODE_ENV,
        database: {
          status: dbStatus.description,
          readyState: dbStatus.readyState,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
