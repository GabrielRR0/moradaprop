/** Tests end-to-end (Supertest + base de datos real de pruebas): viven en test/e2e/ */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: 'test/e2e/.*\\.e2e-spec\\.ts$',
  // Los mismos alias que tsconfig.json: "@/" = src/ y "@test/" = test/.
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '^@test/(.*)$': '<rootDir>/test/$1' },
  transform: { '^.+\\.ts$': ['ts-jest', { diagnostics: { ignoreCodes: [151001] } }] },
  setupFiles: ['<rootDir>/test/support/set-test-env.ts'],
  globalSetup: '<rootDir>/test/support/global-setup.js',
  reporters: ['<rootDir>/test/reporters/spanish-reporter.js'],
  // Las suites comparten una sola base: una a la vez.
  maxWorkers: 1,
  testTimeout: 30000,
};
