// global.d.ts

import { Mongoose } from "mongoose";

// Next.js 환경에서 Mongoose 연결을 캐싱하기 위해 global 객체를 확장
declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

export {};