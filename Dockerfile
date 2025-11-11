# -----------------------------------------------------------------------------
# 1단계: 빌드
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# 빌드 시 placeholder ENV 주입
ARG DB_URI_BUILD_TIME="placeholder_db_uri_for_build"
ENV DB_URI=$DB_URI_BUILD_TIME

RUN npm run build

# -----------------------------------------------------------------------------
# 2단계: 실행
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

ENV NODE_ENV="production"
ENV PORT="3000"

WORKDIR /app

COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./

# standalone 진입점 확인
CMD ["node", "server/index.js"]

