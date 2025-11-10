// jest.config.js

module.exports = {
  // Jest가 TypeScript 파일(.ts)을 인식하고 변환하도록 설정
  preset: 'ts-jest',

  // 테스트 환경을 Node.js로 설정 (API 테스트에 적합)
  testEnvironment: 'node',

  // 테스트 파일의 위치 패턴을 지정
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],

  // 테스트 전에 환경 변수(.env.local)를 로드하도록 설정
  setupFiles: ['dotenv/config'],

  // 🚨 ts-jest 글로벌 설정을 통해 프로젝트 tsconfig 파일을 명시적으로 사용
  // 이 부분이 test.each 오류를 최종적으로 해결합니다.
  globals: {
    'ts-jest': {
      // Next.js 프로젝트의 메인 tsconfig 파일을 사용하도록 지정
      tsconfig: 'tsconfig.json',
    },
  },
};