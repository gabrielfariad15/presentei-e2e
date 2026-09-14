import { defineConfig, devices } from '@playwright/test';

/**
 * Alvo padrao: producao. Sobrescreva com BASE_URL para rodar contra staging ou local.
 *   BASE_URL=http://localhost:8000 npx playwright test
 */
const BASE_URL = process.env.BASE_URL ?? 'https://presenteiapp.com.br';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: BASE_URL,
    // Somente para redes com proxy TLS corporativo (o certificado do proxy nao e
    // reconhecido). Nunca ligar em CI nem no dia a dia: mascara certificado invalido.
    //   PW_INSECURE_TLS=1 npx playwright test
    ignoreHTTPSErrors: process.env.PW_INSECURE_TLS === '1',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});
