// app/api/vote/route.ts (중복 투표 방지 로직 포함)

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ObjectId, Db } from 'mongodb'; // Db 타입을 임포트

// 💡 IP 주소 추출 및 통일 헬퍼 함수 (로컬 테스트 환경 최적화)
const getClientIp = (request: Request) => {
    const host = request.headers.get('host');
    if (host && (host.startsWith('localhost') || host.startsWith('127.0.0.1'))) {
        return '127.0.0.1';
    }
    const xForwardedFor = request.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }
    return 'unknown';
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.vote_option_id) {
        return NextResponse.json({
            success: false,
            message: "Missing 'vote_option_id' in request body."
        }, { status: 400 });
    }

    const clientIp = getClientIp(request);

    // 1. Mongoose 연결 실행
    const connection = await dbConnect();

    // 🚨 2. 오류 해결: Non-null Assertion (!)을 사용하여 Db 할당
    const db: Db = connection.connection.db!;

    const collection = db.collection("votes");

    // 3. 중복 투표 검사 (핵심 로직)
    const existingVote = await collection.findOne({ clientIp: clientIp });

    if (existingVote) {
        console.log('--- Duplicate Vote Blocked --- IP:', clientIp);
        return NextResponse.json({
            success: false,
            message: "Duplicate vote detected. This IP address has already cast a vote.",
        }, { status: 403 });
    }

    // 4. 투표 데이터 준비 및 IP 주소 저장
    const voteData = {
        _id: new ObjectId(),
        voteOptionId: body.vote_option_id,
        timestamp: new Date(),
        clientIp: clientIp,
    };

    const result = await collection.insertOne(voteData);

    // 5. 성공 응답
    console.log('--- New Vote Recorded ---', result.insertedId, 'from IP:', clientIp);

    return NextResponse.json({
      success: true,
      message: "Vote successfully recorded and checked for duplicates.",
      voteId: result.insertedId.toHexString()
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Vote API Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json({
      success: false,
      message: "Internal Server Error during vote processing.",
      details: errorMessage
    }, { status: 500 });
  }
}