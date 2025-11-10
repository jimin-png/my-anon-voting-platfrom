// app/api/vote/results/route.ts (수정된 코드)

import { NextResponse } from 'next/server';
import { getClientPromise } from '@/lib/mongodb';

export async function GET() {
  // 🚨 1. 환경 변수 이름 통일 (DB_URI 사용)
  const uri = process.env.DB_URI;

  if (!uri) {
      // 🚨 2. 오류 메시지 수정 (실제 사용된 변수 이름 반영)
      return NextResponse.json({ message: "Configuration Error: DB_URI is not set." }, { status: 500 });
  }

  // 405 Method Not Allowed 체크는 GET 요청이므로 필요하지 않습니다. (Next.js가 자동 처리)

  let client;

  try {
    // 1. MongoDB 연결
    // getClientPromise 함수는 URI를 인수로 받도록 이전에 수정되었습니다.
    client = await getClientPromise(uri);
    const db = client.db("voting_db");
    const collection = db.collection("votes");

    // 2. MongoDB Aggregation Pipeline을 사용한 집계 (로직은 그대로 유지)
    const aggregationPipeline = [
      {
        // voteOptionId (투표 등록 API에서 사용된 필드명) 별로 그룹화
        $group: {
          _id: "$voteOptionId",
          count: { $sum: 1 }
        }
      },
      {
        // 필드 이름 정리
        $project: {
          _id: 0,
          optionId: "$_id",
          count: 1
        }
      },
      {
        // 투표 수가 많은 순서로 정렬
        $sort: { count: -1 }
      }
    ];

    const results = await collection.aggregate(aggregationPipeline).toArray();

    // 3. 응답 데이터 구성
    const totalVotes = results.reduce((sum, item) => sum + item.count, 0);

    const finalResponse = {
      success: true,
      totalVotes: totalVotes,
      results: results,
      message: '투표 결과 조회 성공',
    };

    // 4. 성공 응답 (HTTP 200 OK)
    return NextResponse.json(finalResponse, { status: 200 });

  } catch (error: any) {
    console.error('Results API Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류: 투표 결과 집계 실패' },
      { status: 500 }
    );
  }
}