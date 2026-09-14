import { test, expect } from '@playwright/test';
import { OCASIOES } from '../support/rotas';

/**
 * Navegacao no DOM hidratado — o que o usuario de verdade ve e clica.
 * A home repete o link de cada ocasiao em mais de um bloco, entao a assercao
 * e "existe pelo menos um", nao "existe exatamente um".
 */

const linkOcasiao = (slug: string) => `a[href^="/ocasiao/${slug}"]`;

test('a home lista todas as ocasioes como link navegavel', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  for (const slug of OCASIOES) {
    const quantos = await page.locator(linkOcasiao(slug)).count();
    expect(quantos, `ocasiao "${slug}" nao aparece na home`).toBeGreaterThanOrEqual(1);
  }
});

// DEFEITO CONHECIDO — PRE-003 no RELATORIO-DEFEITOS.md.
// O card da ocasiao na home tem href="/ocasiao/<slug>", mas o clique e
// interceptado pela SPA e leva para /criar. Quem abre em nova aba vai para um
// destino, quem clica normal vai para outro. Ou o href esta errado, ou o
// handler esta. O teste fixa o invariante: href e clique tem que concordar.
test('o destino do clique bate com o href do card de ocasiao', async ({ page }) => {
  test.fail();
  await page.goto('/', { waitUntil: 'networkidle' });

  const slug = OCASIOES[0];
  const card = page.locator(linkOcasiao(slug)).first();
  const href = await card.getAttribute('href');

  await card.scrollIntoViewIfNeeded();
  await card.click();

  await expect(page, `href="${href}" mas o clique levou para outro lugar`)
    .toHaveURL(new RegExp(`/ocasiao/${slug}`));
});

test('abrir a pagina de ocasiao direto pela URL funciona', async ({ page }) => {
  const slug = OCASIOES[0];
  await page.goto(`/ocasiao/${slug}/`, { waitUntil: 'networkidle' });

  await expect(page).toHaveURL(new RegExp(`/ocasiao/${slug}`));
  await expect(page.locator('h1').first()).toBeVisible();
});

test('a home oferece o caminho para criar o presente', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const cta = page.getByRole('button', { name: /criar/i }).first();
  await expect(cta).toBeVisible();
  await cta.click();

  await expect(page).toHaveURL(/\/criar/);
});

test('a politica de privacidade e alcancavel e volta para a home', async ({ page }) => {
  await page.goto('/privacidade', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: /privacidade/i }).first()).toBeVisible();
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
});
