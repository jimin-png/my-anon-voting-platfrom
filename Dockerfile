# ------------------------------
# 1. Builder
# ------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# package.json, package-lock.json 복사
COPY package*.json ./

# devDependencies 포함 설치
RUN npm install

# 소스코드 복사
COPY . .

# ⚠ 환경 변수 추가
ENV DB_URI="mongodb+srv://kim_db_user:asdf1234@cluster0.2gzovqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
ENV NEXTAUTH_SECRET="a1b2c3d4e5f600112233445566778899aabbccddeeff00112233445566778899aa"
ENV CONTRACT_ADDRESS_VOTING="0xcB6d6d49D4c9eC6635c4D294DbFE0875D7F5fAd8"

# Standalone 빌드
RUN npm run build

# ------------------------------
# 2. Runner
# ------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Standalone 빌드 파일 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public

# 포트
ENV PORT=$PORT

# 서버 실행
CMD ["node", "server.js"]
