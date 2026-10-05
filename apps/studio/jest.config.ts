import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/test/**/*.test.ts'],
  collectCoverageFrom: ['lib/**/*.ts', 'components/**/*.tsx', 'app/**/*.tsx', '!**/*.d.ts'],
};

export default config;
