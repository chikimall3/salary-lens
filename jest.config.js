export default {
  testEnvironment: 'jsdom',
  transform: {},
  extensionsToTreatAsEsm: [],
  testMatch: ['**/tests/**/*.test.js'],
  moduleNameMapper: {
    '../shared/ExtPay\\.module\\.js$': '<rootDir>/tests/mocks/ExtPay.module.js',
    '../shared/soc-codes\\.js$': '<rootDir>/tests/mocks/soc-codes.js',
    '../shared/msa-codes\\.js$': '<rootDir>/tests/mocks/msa-codes.js',
    '../shared/col-index\\.js$': '<rootDir>/tests/mocks/col-index.js',
    '../shared/wage-lookup\\.js$': '<rootDir>/tests/mocks/wage-lookup.js',
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
};
