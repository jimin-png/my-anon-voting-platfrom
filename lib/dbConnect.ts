// lib/dbConnect.ts
import mongoose, { Mongoose } from 'mongoose';

// 1. DB_URI 환경 변수 읽기
// process.env.DB_URI가 없으면 Error를 던집니다.
const DB_URI: string =
  process.env.DB_URI ??
  (() => {
    // 🚨 Next.js 빌드 시점에 Error를 던져 빌드를 중단시킵니다.
    throw new Error(
      'Please define the DB_URI environment variable in your environment settings (Render/Fly.io).'
    );
  })();

// 2. 글로벌 캐싱 변수 정의 및 초기화 (TypeScript 오류 처리)
let cached = global.mongoose;
if (!cached) {
  cached = { conn: null, promise: null };
  global.mongoose = cached;
}

export default async function dbConnect(): Promise<Mongoose> {
  // 3. 캐시된 연결이 있으면 반환
  if (cached.conn) return cached.conn;

  // 4. 연결이 진행 중이 아니면 새로 시작
  if (!cached.promise) {
    cached.promise = mongoose.connect(DB_URI, {
      bufferCommands: false,
    });
  }

  try {
    // 5. 연결 완료 후 캐시 업데이트
    cached.conn = await cached.promise;
  } catch (err) {
    // 6. 연결 실패 시 promise 초기화 및 오류 던지기
    cached.promise = null;
    throw err;
  }

  return cached.conn!;
}