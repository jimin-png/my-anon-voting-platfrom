// __tests__/vote.test.ts

import test, { describe } from 'node:test';
import request from 'supertest';

// Next.js 서버의 기본 주소입니다.
const API_BASE = 'http://localhost:3000/api';
const VOTE_ENDPOINT = '/vote';
const RESULTS_ENDPOINT = '/vote/results';

describe('E2E: Anonymous Voting Platform API', () => {
  let initialTotalVotes = 0;

  // 테스트 시작 전 초기 투표 개수를 확인합니다.
  beforeAll(async () => {
    // DB에 연결되어 있는지 확인하기 위해 /health 체크를 시도할 수도 있습니다.
    const health = await request(API_BASE).get('/health');
    expect(health.statusCode).toBe(200);

    const res = await request(API_BASE).get(RESULTS_ENDPOINT);
    initialTotalVotes = res.body.totalVotes;
  });

  // e2e 무중단 테스트 20회를 시뮬레이션합니다.
  test.each(Array.from({ length: 20 }, (_, i) => i + 1))(
    'Transaction #%i: Should allow first vote and block subsequent votes (Simulating 20 uninterrupted checks)',
    async (i: number) => {
      // 1. 투표 시도 (첫 투표이므로 성공해야 합니다)
      const votePayload = { vote_option_id: `candidate_X` };
      const voteRes = await request(API_BASE)
        .post(VOTE_ENDPOINT)
        .send(votePayload)
        .set('Accept', 'application/json');

      // 첫 번째 시도 (i=1)는 성공해야 합니다.
      if (i === 1) {
        expect(voteRes.statusCode).toBe(200);
        expect(voteRes.body.success).toBe(true);
      } else {
        // 2. 두 번째부터는 중복 투표로 거부되어야 합니다 (403 Forbidden)
        expect(voteRes.statusCode).toBe(403);
        expect(voteRes.body.message).toContain('Duplicate vote detected');
      }

      // 3. 투표 결과 확인 (무중단 상태 검증)
      const resultsRes = await request(API_BASE).get(RESULTS_ENDPOINT);

      // 최종 투표 개수는 첫 번째 투표 후에만 1 증가해야 합니다.
      const expectedVotes = initialTotalVotes + 1;

      // 20회 내내 결과 조회가 200 OK여야 합니다.
      expect(resultsRes.statusCode).toBe(200);
      // 투표 개수는 20회 시도 중 단 1회만 증가했어야 합니다.
      expect(resultsRes.body.totalVotes).toBe(expectedVotes);
    },
    20000 // 타임아웃 20초 (각 테스트 1초)
  );
});