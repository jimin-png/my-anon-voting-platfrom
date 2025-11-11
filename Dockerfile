# -----------------------------------------------------------------------------
# 1단계: 빌드 (Build Stage)
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 설치
COPY package.json package-lock.json ./
RUN npm install

# 소스 전체 복사
COPY . .

# 빌드 타임 환경 변수 임시 주입 (빌드 시 DB/컨트랙트 값 오류 방지)
ARG DB_URI_BUILD_TIME="placeholder_db_uri"
ENV DB_URI=$DB_URI_BUILD_TIME

# Next.js 빌드 (standalone 포함)
RUN npm run build


# -----------------------------------------------------------------------------
# 2단계: 실행 (Runner Stage)
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

WORKDIR /app

# 환경 변수 설정 (Render Secret 값으로 덮어씌워짐)
ENV NODE_ENV=production
ENV PORT=3000

# standalone 모드 + 필요한 node_modules 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 서버 실행
CMD ["node", "server.js"]
