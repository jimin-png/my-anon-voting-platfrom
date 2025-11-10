// lib/dbConnect.ts
import mongoose, { Mongoose } from 'mongoose';

// DB_URI를 무조건 string 으로 만들기 (없으면 즉시 throw)
const DB_URI: string =
  process.env.DB_URI ??
  (() => {
    throw new Error(
      'Please define the DB_URI environment variable inside .env.local'
    );
  })();

// 여기서 'declare global { ... }' 다시 선언 xx
// 이미 global.d.ts 에 동일 타입으로 선언되어 있음 (중복/불일치가 에러 원인)

let cached = global.mongoose;
if (!cached) {
  cached = { conn: null, promise: null };
  global.mongoose = cached;
}

export default async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(DB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn!;
}
