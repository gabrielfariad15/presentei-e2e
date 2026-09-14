import { test, expect } from '@playwright/test';
import { OCASIOES, rotaOcasiao, OCASIAO_INEXISTENTE } from '../support/rotas';

/**
 * As paginas de ocasiao existem para ranquear no Google.
 *
 * IMPORTANTE: estes testes leem o HTML CRU (request), nao o DOM hidratado.
 * E de proposito — o crawler que nao executa JavaScript ve exatamente isto.
 * Depois da hidratacao o React troca o shell por <button>, o que e correto
 * para o usuario e irrelevante para o crawler.
 *
 * Regressao coberta: o CTA ja foi <button> no HTML servido, e o crawler nao
 * seguia o link. Hoje precisa ser <a href="/criar">.
 */

const HOME_TITULO = 'Presentei — o presente digital que abre jogando';

test.describe('Paginas de ocasiao (HTML servido ao crawler)', () => {
  for (const slug of OCASIOES) {
    const rota = rotaOcasiao(slug);

    test(`${rota} — 200, canonical proprio, h1 e title unicos`, async ({ request }) => {
      const resposta = await request.get(rota);
      expect(resposta.status()).toBe(200);
      const html = await resposta.text();

      const canonical = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/.exec(html)?.[1];
      expect(canonical, `canonical ausente em ${rota}`).toBeTruthy();
      expect(canonical!.replace(/\/$/, ''), `canonical de ${rota} nao aponta para ela mesma`)
        .toBe(`https://presenteiapp.com.br${rota}`.replace(/\/$/, ''));

      const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1]?.replace(/<[^>]+>/g, '').trim();
      expect(h1, `h1 ausente em ${rota}`).toBeTruthy();
      expect(h1!.length, `h1 curto demais em ${rota}: "${h1}"`).toBeGreaterThan(10);

      const titulo = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1]?.trim();
      expect(titulo, `${rota} herdou o title da home`).not.toBe(HOME_TITULO);
    });

    test(`${rota} — CTA e link rastreavel, nao botao`, async ({ request }) => {
      const html = await (await request.get(rota)).text();

      const links = [...html.matchAll(/<a\b[^>]*href="\/criar"[^>]*>/g)];
      expect(links.length, `nenhum <a href="/criar"> no HTML de ${rota}`).toBeGreaterThanOrEqual(1);

      const botoesNoShell = [...html.matchAll(/<button\b[^>]*class="[^"]*cta[^"]*"/g)];
      expect(botoesNoShell.length, 'CTA voltou a ser <button> no HTML servido').toBe(0);
    });
  }
});

test.describe('Rota de ocasiao invalida', () => {
  // DEFEITO CONHECIDO — PRE-001 no RELATORIO-DEFEITOS.md.
  // Hoje o servidor devolve 200 com o shell da home (soft 404).
  // test.fail() registra o defeito sem deixar a CI vermelha: quando for
  // corrigido, o Playwright avisa que o teste passou inesperadamente.
  test('slug inexistente deveria devolver 404', async ({ request }) => {
    test.fail();
    const resposta = await request.get(rotaOcasiao(OCASIAO_INEXISTENTE));
    expect(resposta.status()).toBe(404);
  });

  test('slug inexistente ao menos nao se declara canonical proprio', async ({ request }) => {
    const html = await (await request.get(rotaOcasiao(OCASIAO_INEXISTENTE))).text();
    const canonical = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/.exec(html)?.[1];
    expect(canonical, 'pagina fantasma se anunciando como canonical duplica conteudo no indice')
      .toBe('https://presenteiapp.com.br/');
  });
});
