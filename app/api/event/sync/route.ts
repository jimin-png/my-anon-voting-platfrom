// app/api/event/sync/route.ts (간소화된 API 핸들러)

import { NextResponse } from 'next/server';
import { syncEventAndConfirm } from '@/lib/services/db.service'; // 새로운 서비스 함수 import

// 참고: MAX_CONFIRMATIONS는 이제 db.service.ts 파일에 정의되어 있습니다.

export async function POST(request: Request) {
  const uri = process.env.DB_URI;

  if (!uri) {
      return NextResponse.json({ message: "Configuration Error: DB_URI is not set." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { eventId, requestId } = body;

    if (!eventId || !requestId) {
        return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    // 💡 핵심: 복잡한 로직을 서비스 파일로 분리
    const result = await syncEventAndConfirm(eventId, requestId, uri);

    // 블록체인 통합을 위해 이 함수만 나중에 교체하면 됩니다.

    // 성공 응답 반환 (서비스에서 반환된 상태를 사용)
    return NextResponse.json({
        success: true,
        message: `Event '${eventId}' processed. Status: ${result.status}.`,
        status: result.status,
        confirmationCount: result.confirmationCount,
    }, { status: 200 });

  } catch (error) {
    // 재시도 백오프 로직 유지
    const retryAfterSeconds = 50;
    console.error("Event Sync API Error (Retry Backoff Suggested):", error);

    return NextResponse.json({
      success: false,
      message: `Internal server error. Please retry after ${retryAfterSeconds} seconds.`,
      error_type: 'TRANSIENT_FAILURE'
    }, {
      status: 503,
      headers: { 'Retry-After': retryAfterSeconds.toString(), }
    });
  }
}