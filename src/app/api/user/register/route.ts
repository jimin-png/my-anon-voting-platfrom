// src/app/api/user/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// @ts-ignore: dbConnect 모듈을 찾을 수 없다는 오류를 무시합니다.
import dbConnect from '@/lib/dbConnect';
// @ts-ignore: Voter 모델을 찾을 수 없다는 오류를 무시합니다.
import Voter from '@/models/Voter';

// 요청 데이터에 대한 Zod 스키마 정의
const RegisterSchema = z.object({
    name: z.string().min(1, "이름은 필수 항목입니다."),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "올바른 지갑 주소 형식이 아닙니다."),
    studentId: z.string().length(8, "학번은 8자리여야 합니다."),
    email: z.string().email("유효한 이메일 형식이 아닙니다.").optional(),
});

export async function POST(req: NextRequest) {
    // API POST 핸들러 진입 확인 로그 (디버깅용)
    console.log("--- API POST Handler Entered (Register) ---");

    await dbConnect();

    let data;

    try {
        // 1. JSON 본문을 파싱
        data = await req.json();
    } catch (e) {
        // JSON 파싱 실패 시 400 Bad Request 반환
        return new Response(
            JSON.stringify({ success: false, message: '유효하지 않은 JSON 형식입니다.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        // 2. Zod 스키마를 사용하여 데이터 유효성 검사
        const validatedData = RegisterSchema.parse(data);

        // 3. 중복 유권자 검사 (walletAddress 또는 studentId 기준)
        const existingVoter = await Voter.findOne({
            $or: [
                { walletAddress: validatedData.walletAddress },
                { studentId: validatedData.studentId },
            ],
        });

        if (existingVoter) {
            return new Response(
                JSON.stringify({ success: false, message: '이미 등록된 지갑 주소이거나 학번입니다.' }),
                { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 4. 새로운 유권자 생성
        const newVoter = await Voter.create(validatedData);

        console.log("--- New Voter Registered ---", newVoter.walletAddress);

        return new Response(
            JSON.stringify({ success: true, message: '유권자 등록 완료', data: newVoter }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: unknown) {
        // Zod 유효성 검사 실패 (400 처리)
        if (error instanceof z.ZodError) {
          const firstMessage = error.issues?.[0]?.message ?? '유효성 검사에 실패했습니다.';
          return new Response(
                JSON.stringify({ success: false, message: firstMessage }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 기타 서버 오류 (Mongoose Validation 등)
        console.error("API Error:", error);
        return new Response(
            JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}