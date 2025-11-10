// lib/mongodb.ts
import { MongoClient } from 'mongodb';

const options = {};

// 🚨 URI를 인수로 받도록 함수를 수정합니다.
export function getClientPromise(uri: string): Promise<MongoClient> {
  if (!uri) {
    // 이제 여기서 오류가 발생할 일은 없어야 합니다.
    throw new Error('URI is missing in getClientPromise call.');
  }

  let client: MongoClient;
  let clientPromise: Promise<MongoClient>;

  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      // @ts-ignore
      global._mongoClientPromise = client.connect();
    }
    // @ts-ignore
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}