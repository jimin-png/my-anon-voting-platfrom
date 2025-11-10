// app/api/vote/route.ts (중복 투표 방지 로직 포함)

import { NextResponse } from 'next/server';
// 🚨 1. Import 오류 수정: getClientPromise 대신 clientPromise를 default import
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// 💡 IP 주소 추출 및 통일 헬퍼 함수 (로컬 테스트 환경 최적화)
const getClientIp = (request: Request) => {
    const host = request.headers.get('host');
    // 로컬호스트 환경 테스트 시 IP를 127.0.0.1로 통일
    if (host && (host.startsWith('localhost') || host.startsWith('127.0.0.1'))) {
        return '127.0.0.1';
    }
    // 실제 배포 환경 로직
    const xForwardedFor = request.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }
    return 'unknown';
};

export async function POST(request: Request) {
  // 🚨 3. 불필요한 DB_URI 확인 로직 삭제 (lib/mongodb.ts에서 처리함)
  // const uri = process.env.DB_URI;
  // if (!uri) { ... }

  let client;

  try {
    const body = await request.json();

    if (!body.vote_option_id) {
        return NextResponse.json({
            success: false,
            message: "Missing 'vote_option_id' in request body."
        }, { status: 400 });
    }

    // 1. 클라이언트 IP 주소 추출
    const clientIp = getClientIp(request);

    // 🚨 2. DB 연결 방식 수정: clientPromise 변수를 바로 await
    client = await clientPromise;
    const db = client.db("voting_db"); // DB 이름은 프로젝트에 맞게 수정하세요.
    const collection = db.collection("votes");

    // 2. 🚨 중복 투표 검사 (핵심 로직)
    const existingVote = await collection.findOne({ clientIp: clientIp });

    if (existingVote) {
        // 이미 해당 IP 주소로 투표한 기록이 있다면 거부
        console.log('--- Duplicate Vote Blocked --- IP:', clientIp);
        return NextResponse.json({
            success: false,
            message: "Duplicate vote detected. This IP address has already cast a vote.",
        }, { status: 403 }); // 403 Forbidden 상태 코드 사용
    }

    // 3. 투표 데이터 준비 및 IP 주소 저장
    const voteData = {
        _id: new ObjectId(),
        voteOptionId: body.vote_option_id,
        timestamp: new Date(),
        clientIp: clientIp, // 🚨 중복 방지 확인을 위해 IP 주소 저장
    };

    const result = await collection.insertOne(voteData);

    // 4. 성공 응답
    console.log('--- New Vote Recorded ---', result.insertedId, 'from IP:', clientIp);

    return NextResponse.json({
      success: true,
      message: "Vote successfully recorded and checked for duplicates.",
      voteId: result.insertedId.toHexString()
    }, { status: 200 });

  } catch (error) {
    console.error("Vote API Error:", error);
    return NextResponse.json({
      success: false,
      message: "Internal Server Error during vote processing."
    }, { status: 500 });
  }
}