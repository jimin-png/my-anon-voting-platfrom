// lib/dbConnect.ts
import mongoose, { Mongoose } from 'mongoose';

// 🚨🚨🚨 디버깅 코드 추가 위치 (START) 🚨🚨🚨
console.log("ENV CHECK: NEXTAUTH_SECRET length:", process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : "UNDEFINED");
console.log("ENV CHECK: CONTRACT_ADDRESS_VOTING:", process.env.CONTRACT_ADDRESS_VOTING ? "RECEIVED" : "UNDEFINED");
// 🚨🚨🚨 디버깅 코드 추가 위치 (END) 🚨🚨🚨

// 1. DB_URI 환경 변수 읽기 (없으면 빌드 중단)
const DB_URI: string =
  process.env.DB_URI ??
  (() => {
    throw new Error(
      'Please define the DB_URI environment variable in your environment settings (Render/Fly.io).'
    );
  })();

// 2. 글로벌 캐싱 변수 정의 및 초기화 (TypeScript 오류 처리)
// 🚨 수정: global.mongoose 사용 시 오류 방지

let cached = global.mongoose;
if (!cached) {
  cached = { conn: null, promise: null };
  // 🚨 수정: global.mongoose 할당 시 오류 방지

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

  // 연결이 확실히 되었음을 보장
  return cached.conn!;
}