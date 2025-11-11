// app/api/vote/results/route.ts

import { NextResponse } from 'next/server';
// 🚨 Mongoose 연결 함수 임포트
import dbConnect from '@/lib/dbConnect';
// 🚨 Mongoose Schema (Vote 모델) 임포트 (파일 경로는 프로젝트에 맞게 수정 필요)
// import Vote from '@/models/vote'; // 예시 모델 파일 경로

// 투표 결과 조회 API
export async function GET() {
    try {
        // 1. Mongoose 연결 시작
        await dbConnect();

        // 2. 🚨 MongoDB Driver 로직을 Mongoose aggregate 로직으로 대체
        // 이 로직은 MongoDB Driver의 집계 파이프라인을 Mongoose 모델에 적용해야 합니다.

        /*
        // Mongoose 모델을 사용한다고 가정하고, MongoDB Driver에서 Mongoose로 변환 (예시)

        // const client = await clientPromise;
        // const db = client.db("voting_db");
        // const collection = db.collection("votes");

        const aggregationPipeline = [
            // $group (투표 옵션별 카운트)
            {
                $group: {
                    _id: "$voteOptionId",
                    count: { $sum: 1 }
                }
            },
            // $project (필드 이름 정리)
            {
                $project: {
                    _id: 0,
                    voteOptionId: "$_id",
                    count: 1
                }
            },
            // $sort (내림차순 정렬)
            {
                $sort: { count: -1 }
            }
        ];

        // 🚨 투표 모델(Vote)이 Mongoose로 정의되어 있어야 합니다.
        // const results = await Vote.aggregate(aggregationPipeline).exec();

        // **현재는 Mongoose 모델이 없다는 가정하에 임시 데이터 반환 (추후 모델 사용 필수)**
        const results = [
             { voteOptionId: "Option A", count: 15 },
             { voteOptionId: "Option B", count: 10 },
        ];
        */

        // 🚨 DB 연결/쿼리 로직은 팀원과 상의하여 Mongoose 모델을 사용하여 다시 작성해야 합니다.
        // 임시로 성공 응답을 보냅니다.
        const results = [{ message: "DB Connection Check Succeeded, Mongoose logic needed." }];


        return NextResponse.json({
            success: true,
            results: results,
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Results API Error:", error);

        const errorMessage = error instanceof Error ? error.message : String(error);

        return NextResponse.json({
            success: false,
            message: "Internal Server Error during results aggregation.",
            details: errorMessage
        }, { status: 500 });
    }
}