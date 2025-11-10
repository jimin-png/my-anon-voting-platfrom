// app/api/health/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // 🚨 Mongoose 연결 함수 import

export async function GET() {
  // 🚨 1. DB_URI 변수 확인 로직 제거: dbConnect 내부에서 처리함.
  // const uri = process.env.DB_URI;
  // if (!uri) { ... }

  try {
    // 🚨 2. Mongoose 연결 실행 및 상태 확인
    // dbConnect가 성공하면 Mongoose 연결이 보장됩니다.
    await dbConnect();

    // 3. 성공 응답
    return NextResponse.json({
      status: 'ok',
      service: 'API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }, { status: 200 }); // 200 OK: 서버와 DB 모두 정상

  } catch (error: unknown) { // 🚨 4. 타입 오류 방지 및 오류 처리 표준화
    // 4. 실패 응답 (DB 연결 오류 등)
    console.error('Health Check Failed:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json({
      status: 'error',
      service: 'API is running',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      message: `Database connection failed: ${errorMessage}`
    }, { status: 500 }); // 500 Internal Server Error: 서버 자체는 작동하나 핵심 의존성(DB) 문제
  }
}