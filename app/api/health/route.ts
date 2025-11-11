import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({
      status: 'ok',
      service: 'API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Health Check Failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      status: 'error',
      service: 'API is running',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      message: `Database connection failed: ${errorMessage}`
    }, { status: 500 });
  }
}
