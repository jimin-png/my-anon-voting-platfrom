// lib/dbConnect.ts
import mongoose, { Mongoose } from 'mongoose';

// 🚨🚨🚨 1. declare global 블록을 완전히 제거했습니다. 🚨🚨🚨

// 🚨🚨🚨 디버깅 코드 (START) 🚨🚨🚨
console.log("ENV CHECK: NEXTAUTH_SECRET length:", process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : "UNDEFINED");
console.log("ENV CHECK: CONTRACT_ADDRESS_VOTING:", process.env.CONTRACT_ADDRESS_VOTING ? "RECEIVED" : "UNDEFINED");
// 🚨🚨🚨 디버깅 코드 (END) 🚨🚨🚨

// 1. DB_URI 환경 변수 읽기 (없으면 빌드 중단)
const DB_URI: string =
  process.env.DB_URI ??
  (() => {
    throw new Error(
      'Please define the DB_URI environment variable in your environment settings (Render/Fly.io).'
    );
  })();

// 2. 글로벌 캐싱 변수 정의 및 초기화 (프로젝트의 전역 정의에 의존)
// @ts-ignore를 사용하지 않고, 전역 정의에 의존합니다.
let cached = global.mongoose;
if (!cached) {
  cached = { conn: null, promise: null };
  // @ts-ignore: 전역 변수 할당 시 TypeScript 오류 무시 (최후의 수단)
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