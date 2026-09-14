import { test, expect } from '@playwright/test';

/**
 * Regressao dos cabecalhos de seguranca.
 * Os valores abaixo foram lidos da resposta real de producao em 14/09/2026,
 * nao inventados. Se alguem afrouxar a politica num deploy, o teste quebra.
 */

test.describe('Cabecalhos de seguranca', () => {
  test('home devolve o conjunto esperado de cabecalhos', async ({ request }) => {
    const resposta = await request.get('/');
    expect(resposta.status()).toBe(200);

    const h = resposta.headers();

    // Content-Security-Policy: script so da propria origem (bloqueia XSS injetado)
    expect(h['content-security-policy'], 'CSP ausente').toBeTruthy();
    expect(h['content-security-policy']).toContain("default-src 'self'");
    expect(h['content-security-policy']).toContain("script-src 'self'");
    expect(h['content-security-policy']).toContain("frame-ancestors 'self'");

    // Impede o browser de adivinhar o content-type
    expect(h['x-content-type-options']).toBe('nosniff');

    // Clickjacking
    expect(h['x-frame-options']?.toUpperCase()).toBe('SAMEORIGIN');

    // HTTPS obrigatorio por pelo menos um ano
    const hsts = h['strict-transport-security'] ?? '';
    const maxAge = Number(/max-age=(\d+)/.exec(hsts)?.[1] ?? 0);
    expect(maxAge, `HSTS fraco ou ausente: "${hsts}"`).toBeGreaterThanOrEqual(31_536_000);

    // Nao vazar URL completa para terceiros
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // Camera, microfone e localizacao negados
    const pp = h['permissions-policy'] ?? '';
    for (const recurso of ['camera=()', 'microphone=()', 'geolocation=()']) {
      expect(pp, `Permissions-Policy sem ${recurso}: "${pp}"`).toContain(recurso);
    }
  });

  test('nao expoe cabecalho de tecnologia do servidor de aplicacao', async ({ request }) => {
    const h = (await request.get('/')).headers();
    expect(h['x-powered-by'], 'X-Powered-By expoe a stack').toBeUndefined();
  });
});
