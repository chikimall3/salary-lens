export default {
  testEnvironment: 'jsdom',
  transform: {},
  extensionsToTreatAsEsm: [],
  testMatch: ['**/tests/**/*.test.js'],
  moduleNameMapper: {
    '../shared/ExtPay\\.module\\.js$': '<rootDir>/tests/mocks/ExtPay.module.js',
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
};
