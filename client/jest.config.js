module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/integration/',
    '/tests/e2e/'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    // Exclude UI-heavy files from global coverage (require manual/E2E testing)
    '!src/app.ts',
    '!src/delete.ts',
    // Include core modules (validators and models) now that we have tests
    // Exclude crypto module (covered in PR #1, has separate tests)
    '!src/core/crypto/**',
    '!src/core/models/**', // Type-only module, no runtime code to test
    '!src/infrastructure/**',
    '!src/application/**',
    '!src/presentation/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 65,
      lines: 50,
      statements: 50
    },
    // Critical security files require high coverage
    './src/security.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Core modules require high coverage (PR #2)
    './src/core/validators/index.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};