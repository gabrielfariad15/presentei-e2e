import { test, expect } from '@playwright/test';

/**
 * Smoke: se algum destes quebrar, nao adianta rodar o resto.
 *
 * Nota de arquitetura, apurada em 14/09/2026 inspecionando o DOM:
 * o servidor entrega um shell de pre-render (#seo-prerender) para o crawler;
 * quando o React hidrata, esse shell e removido e a SPA assume. Por isso os
 * testes de SEO leem o HTML cru (request) e os de navegacao leem o DOM
 * hidratado (page). Misturar os dois foi o que quebrou a primeira versao.
 */

const PAGINAS = [
  { rota: '/', temRoot: true, tituloEsperado: /Presentei/i },
  { rota: '/criar', temRoot: true, tituloEsperado: /Presentei/i },
  { rota: '/privacidade', temRoot: false, tituloEsperado: /Privacidade/i },
] as const;

test.describe('Smoke — paginas publicas sobem', () => {
  for (const { rota, temRoot, tituloEsperado } of PAGINAS) {
    test(`${rota} responde 200 e renderiza`, async ({ page }) => {
      const resposta = await page.goto(rota, { waitUntil: 'networkidle' });

      expect(resposta, `sem resposta HTTP para ${rota}`).not.toBeNull();
      expect(resposta!.status(), `status inesperado em ${rota}`).toBe(200);
      await expect(page).toHaveTitle(tituloEsperado);

      if (temRoot) {
        const root = page.locator('#root');
        await expect(root).toBeAttached();
        expect(await root.locator('> *').count(), `#root vazio em ${rota}`).toBeGreaterThan(0);
      }
    });
  }
});

test('home nao emite erro de console nem requisicao falha', async ({ page }) => {
  const errosConsole: string[] = [];
  const requisicoesFalhas: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errosConsole.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && res.url().includes('presenteiapp.com.br')) {
      requisicoesFalhas.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto('/', { waitUntil: 'networkidle' });

  expect(errosConsole, `erros de console: ${errosConsole.join(' | ')}`).toHaveLength(0);
  expect(requisicoesFalhas, `requisicoes falhas: ${requisicoesFalhas.join(' | ')}`).toHaveLength(0);
});

test.describe('Acessibilidade minima', () => {
  test('a home tem exatamente uma h1', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(await page.locator('h1').count(), 'mais de uma h1 confunde crawler e leitor de tela').toBe(1);
  });

  // DEFEITO CONHECIDO — PRE-002 no RELATORIO-DEFEITOS.md.
  // A tela /criar sobe sem nenhuma h1. Vira verde no dia em que for corrigido.
  test('a tela /criar deveria ter uma h1', async ({ page }) => {
    test.fail();
    await page.goto('/criar', { waitUntil: 'networkidle' });
    expect(await page.locator('h1').count()).toBeGreaterThan(0);
  });
});
