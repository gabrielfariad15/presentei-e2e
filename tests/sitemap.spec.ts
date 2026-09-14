import { test, expect } from '@playwright/test';
import { OCASIOES, rotaOcasiao, ROTAS_ESTATICAS } from '../support/rotas';

/**
 * Integridade do sitemap: sitemap que anuncia URL morta derruba confianca
 * do crawler no site inteiro.
 */

test('todas as URLs do sitemap respondem 200', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  expect(urls.length, 'sitemap vazio ou fora do formato esperado').toBeGreaterThan(0);

  const quebradas: string[] = [];
  for (const url of urls) {
    const status = (await request.get(url)).status();
    if (status !== 200) quebradas.push(`${status} ${url}`);
  }

  expect(quebradas, `URLs quebradas no sitemap: ${quebradas.join(' | ')}`).toHaveLength(0);
});

test('sitemap cobre todas as ocasioes que o codigo conhece', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const esperadas = [...ROTAS_ESTATICAS, ...OCASIOES.map(rotaOcasiao)];

  const faltando = esperadas.filter(
    (rota) => rota !== '/criar' && !xml.includes(`presenteiapp.com.br${rota}`),
  );

  expect(faltando, `rotas fora do sitemap: ${faltando.join(', ')}`).toHaveLength(0);
});

test('robots.txt protege as rotas privadas', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('Disallow: /api/');
  expect(txt, 'as paginas de presente (/p/) nao podem ser indexadas').toContain('Disallow: /p/');
  expect(txt).toContain('Sitemap: https://presenteiapp.com.br/sitemap.xml');
});
