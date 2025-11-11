import { NextRequest, NextResponse } from 'next/server';

// 1. RateLimit 설정을 환경 변수에서 가져옵니다. (TypeScript 오류 해결)
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15분 (900,000ms)

// 메모리 기반 캐시를 사용하여 IP별 요청 횟수를 저장합니다. (개발 환경용)
const rateLimitCache = new Map();

// 클라이언트 IP를 안전하게 추출하는 헬퍼
function getClientIp(req: NextRequest): string | null {
    const xff = req.headers.get('x-forwarded-for')
        || req.headers.get('x-real-ip')
        || req.headers.get('x-vercel-forwarded-for');
    if (!xff) return null;
    return xff.split(',')[0].trim();
}

// 2. CORS 허용 출처 설정 (환경 변수 적용)
const envOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((s: string) => s.trim()) : [];

const allowedOrigins = [
    'http://localhost:3000', // 백엔드 개발 환경
    'http://localhost:3001', // 프론트엔드 개발 환경 (일반적인 포트)
    ...envOrigins, // Render/Fly.io 배포 환경의 프론트 주소 추가
];

// 3. RateLimit 로직 함수
function applyRateLimit(ip: string): boolean {
    const now = Date.now();

    // IP에 대한 캐시가 없으면 새로 생성
    if (!rateLimitCache.has(ip)) {
        rateLimitCache.set(ip, {
            count: 0,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
    }

    const cache = rateLimitCache.get(ip);

    // 윈도우 시간이 지났으면 카운트 초기화
    if (cache.resetTime < now) {
        cache.count = 0;
        cache.resetTime = now + RATE_LIMIT_WINDOW_MS;
    }

    // 카운트 증가 및 제한 확인
    cache.count += 1;
    return cache.count > RATE_LIMIT_MAX;
}

// 4. Next.js Middleware 함수 (모든 요청을 처리합니다)
export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    const origin = request.headers.get('origin');
    const response = NextResponse.next();

    // I. CORS 처리
    // origin이 허용된 목록에 포함되거나, origin이 없으면 허용 (Postman 등)
    if (origin && allowedOrigins.includes(origin) || !origin) {
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true'); // 인증 정보 허용
    }

    // II. OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
        // Preflight 요청에 대한 응답은 허용된 Origin을 포함해야 합니다.
        if (origin && allowedOrigins.includes(origin) || !origin) {
             const preflightResponse = new Response(null, { status: 204 });
             preflightResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
             preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
             preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
             preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
             return preflightResponse;
        }
        // 허용되지 않은 오리진에 대한 OPTIONS 요청은 거부합니다.
        return new Response('Not Allowed', { status: 403 });
    }

    // III. RateLimit 처리 (API 경로에 대해서만)
    if (url.pathname.startsWith('/api')) {
        const ip = getClientIp(request) ?? 'anonymous'; // header 기반으로 IP 추출, 없으면 'anonymous'

        if (applyRateLimit(ip)) {
            // 속도 제한 초과 응답 (429 Too Many Requests)
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '요청 속도가 너무 빠릅니다. 잠시 후 다시 시도해 주세요.',
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(rateLimitCache.get(ip).resetTime),
                    },
                }
            );
        }
    }

    return response;
}

// 5. 미들웨어를 적용할 경로를 설정합니다. (모든 요청에 적용)
export const config = {
    matcher: ['/api/:path*', '/:path*'],
};