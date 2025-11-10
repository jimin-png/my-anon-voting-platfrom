# -----------------------------------------------------------------------------
# 1단계: 빌드 (Build Stage)
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build # Next.js 빌드 실행 (standalone 폴더 생성)

# -----------------------------------------------------------------------------
# 2단계: 실행 (Runner Stage) - 최소한의 파일만 포함
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

# 환경 변수 설정
ENV NODE_ENV="production"
ENV PORT="3000" 

WORKDIR /app

# Standalone 모드의 핵심: 실행에 필요한 최소한의 파일만 복사
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./

# 서버 실행 명령어: standalone 모드의 진입점
CMD ["node", "server.js"]