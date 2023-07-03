module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/?(*.)+(test).ts'],
  restoreMocks: true,
  resetMocks: true,
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
