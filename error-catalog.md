# 익명 투표 시스템 API 에러 카탈로그 (Error Catalog)

본 문서는 Next.js API Routes를 통해 구현된 백엔드 API에서 발생하는 모든 응답의 HTTP 상태 코드와 그에 따른 에러 메시지를 표준화하여 정의합니다.

프론트엔드 팀은 이 명세서를 기준으로 사용자에게 보여줄 메시지를 처리합니다.

## 1. 성공 응답 (2xx)

| 상태 코드 | 경로 | 조건 | 응답 Body |
| :--- | :--- | :--- | :--- |
| **200 OK** | `GET /health` | DB 연결 정상 | `{"ok":true, "db":"connected"}` |
| **200 OK** | `GET /vote/results` | 투표 결과 조회 성공 | `{ "success": true, "totalVotes": 1, "results": [...] }` |
| **201 Created** | `POST /user/register` | 유권자 등록 성공 | `{"success": true, "message": "유권자 등록 완료"}` |
| **201 Created** | `POST /vote/create` | 투표 기록 성공 | `{"success": true, "message": "투표 기록 완료"}` |

## 2. 클라이언트 오류 (4xx) - 예상 가능한 사용자 오류

프론트엔드가 사용자에게 직접 에러 메시지를 보여줘야 하는 경우입니다.

### 4.1. 400 Bad Request (잘못된 요청 데이터)

| 경로 | 발생 조건 | 응답 Body (표준) |
| :--- | :--- | :--- |
| `POST /user/register` | 필수 필드 (`name`, `walletAddress`, `studentId`) 누락 | `{"success": false, "message": "필수 항목(name, walletAddress, studentId)을 확인해주세요."}` |
| `POST /vote/create` | 필수 필드 (`walletAddress`, `candidate`) 누락 | `{"success": false, "message": "walletAddress와 candidate는 필수 항목입니다."}` |

### 4.2. 403 Forbidden (자격 없음)

| 경로 | 발생 조건 | 응답 Body (표준) |
| :--- | :--- | :--- |
| `POST /vote/create` | `walletAddress`가 DB에 미등록된 경우 | `{"success": false, "message": "등록되지 않은 유권자입니다."}` |

### 4.3. 409 Conflict (데이터 충돌/중복)

| 경로 | 발생 조건 | 응답 Body (표준) | 프론트엔드 표시 예시 |
| :--- | :--- | :--- | :--- |
| `POST /user/register` | `walletAddress` 또는 `studentId`가 DB에 이미 존재 | `{"success": false, "message": "이미 등록된 지갑 주소이거나 학번입니다."}` | "이미 등록된 사용자입니다." |
| `POST /vote/create` | 해당 유권자가 이미 투표를 완료한 경우 | `{"success": false, "message": "이미 투표에 참여하셨습니다."}` | "이미 투표를 완료했습니다." |

## 3. 서버 오류 (5xx) - 예기치 않은 시스템 오류

| 상태 코드 | 발생 조건 | 응답 Body (표준) | 프론트엔드 표시 예시 |
| :--- | :--- | :--- | :--- |
| **500 Internal Server Error** | DB 연결 끊김, Mongoose 쿼리 실패, 코드 논리 오류 등 | `{"success": false, "message": "서버 오류가 발생했습니다."}` | "서비스에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." |