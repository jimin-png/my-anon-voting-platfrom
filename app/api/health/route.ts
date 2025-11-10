// app/api/health/route.ts (수정된 코드)

import { NextResponse } from 'next/server';
import { getClientPromise } from '@/lib/mongodb'; // 현재 사용 중인 DB 연결 모듈

export async function GET() {
  const uri = process.env.DB_URI;

  if (!uri) {
    return NextResponse.json({
      status: 'error',
      message: 'Configuration Error: DB_URI is not set.'
    }, { status: 500 });
  }

  let client;

  try {
    // 1. MongoDB 연결 시도 (getClientPromise 사용)
    client = await getClientPromise(uri);
    const db = client.db('voting_db');

    // 2. 간단한 DB 쿼리 실행 (DB 연결이 정상인지 확인)
    await db.listCollections().toArray();

    // 3. 성공 응답
    return NextResponse.json({
      status: 'ok',
      service: 'API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }, { status: 200 }); // 200 OK: 서버와 DB 모두 정상

  } catch (error) {
    // 4. 실패 응답 (DB 연결 오류 등)
    console.error('Health Check Failed:', error);
    return NextResponse.json({
      status: 'error',
      service: 'API is running',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      message: 'Database connection failed.'
    }, { status: 500 }); // 500 Internal Server Error: 서버 자체는 작동하나 핵심 의존성(DB) 문제
  }
}
