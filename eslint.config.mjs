import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import moduleBoundaries from './eslint-rules/module-boundaries.mjs';

/**
 * Reglas de arquitectura del proyecto (ver docs/CONVENCIONES.md):
 *  - Nadie lee process.env fuera de config/.
 *  - Ningun archivo supera 600 lineas.
 *  - No se importan archivos internos de otro modulo (solo su archivo padre).
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.test-report/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      'max-lines': ['error', { max: 600, skipBlankLines: true, skipComments: true }],
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Lee las variables de entorno desde la capa config/, no con process.env.',
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // API y web: de otro modulo solo se importa su archivo padre.
    files: ['apps/*/src/**/*.{ts,tsx}'],
    plugins: { local: moduleBoundaries },
    rules: { 'local/no-internal-imports': 'error' },
  },
  {
    // Paquetes de terceros envueltos: solo se usan a traves de apps/api/src/support/<modulo> (ver support/README.md).
    files: ['apps/api/**/*.ts'],
    ignores: ['apps/api/src/support/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ['argon2', 'support/password'],
            ['ioredis', 'support/cache'],
            ['nodemailer', 'support/mail'],
            ['sharp', 'support/images'],
            ['@nestjs/jwt', 'support/jwt'],
            ['google-auth-library', 'support/google-identity'],
            ['otplib', 'support/totp'],
            ['qrcode', 'support/totp'],
            ['exceljs', 'support/spreadsheet'],
            ['@prisma/client', 'support/db'],
          ].map(([name, wrapper]) => ({
            name,
            message: `No importes "${name}" directo: usa el wrapper ${wrapper} (docs/CONVENCIONES.md, "Paquetes de terceros").`,
          })),
        },
      ],
    },
  },
  {
    // Unicos lugares donde se permite process.env.
    files: [
      'apps/api/src/config/env.ts',
      'apps/api/test/support/**',
      'apps/api/prisma/**',
      'apps/web/src/config/env.ts',
      '**/*.config.{js,mjs,ts}',
      '**/scripts/**',
    ],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    // Hooks generados desde el diseno (scripts/diseno-a-react): JS tal cual, se tipan al conectar el API.
    files: ['apps/web/src/modules/*/hooks/**/*.ts'],
    rules: { '@typescript-eslint/ban-ts-comment': 'off' },
  },
  {
    // Scripts y reporters en CommonJS.
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
