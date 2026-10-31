/** Tests unitarios: viven junto a cada modulo en src/modules/<modulo>/tests/ */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: 'src/.*\\.spec\\.ts$',
  // Los mismos alias que tsconfig.json: "@/" = src/ y "@test/" = test/.
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '^@test/(.*)$': '<rootDir>/test/$1' },
  transform: { '^.+\\.ts$': ['ts-jest', { diagnostics: { ignoreCodes: [151001] } }] },
  setupFiles: ['<rootDir>/test/support/set-test-env.ts'],
  reporters: ['<rootDir>/test/reporters/spanish-reporter.js'],
};
