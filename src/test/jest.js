const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  roots: ['<rootDir>/public', '<rootDir>/server', '<rootDir>/common'],
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@elastic/eui$': '<rootDir>/../../node_modules/@elastic/eui',
    '^@elastic/eui/(.*)$': '<rootDir>/../../node_modules/@elastic/eui/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@elastic/eui|@tanstack/react-query|zustand|zod)/)',
  ],
  collectCoverageFrom: [
    '<rootDir>/{common,public,server}/**/*.{ts,tsx}',
    '!<rootDir>/{common,public,server}/**/*.test.{ts,tsx}',
    '!<rootDir>/{common,public,server}/**/index.{ts,tsx}',
    '!<rootDir>/**/types.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  testTimeout: 10000,
};
