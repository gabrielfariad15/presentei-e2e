# Relatório de defeitos — Presentei

Ambiente: produção, `https://presenteiapp.com.br`
Data da apuração: 14/09/2026
Ferramenta: Playwright 1.47, Chromium desktop e Pixel 7

Cada defeito abaixo tem um teste correspondente marcado com `test.fail()`.
A suíte fecha verde com o defeito presente e **avisa quando ele for corrigido**
(o Playwright reporta "expected to fail, but passed").

---

## PRE-001 — Rota de ocasião inexistente devolve 200 em vez de 404

**Severidade:** média
**Onde:** `GET /ocasiao/<slug-qualquer>/`
**Teste:** `tests/seo-ocasioes.spec.ts` → "slug inexistente deveria devolver 404"

**Passos**

1. `curl -o /dev/null -w "%{http_code}" https://presenteiapp.com.br/ocasiao/slug-que-nao-existe-9f2a/`

**Esperado:** `404`
**Obtido:** `200`, com o shell da home (9.906 bytes)

**Impacto:** qualquer URL sob `/ocasiao/` vira página indexável. O Google trata
isso como soft 404 e pode derrubar a confiança nas seis páginas de ocasião que
são legítimas. Um link digitado errado nunca sinaliza erro ao usuário.

**Atenuante já existente:** o `canonical` da página fantasma aponta para `/`, o
que reduz o risco de conteúdo duplicado. Há um segundo teste que trava esse
comportamento para ele não se perder numa refatoração.

---

## PRE-002 — A tela `/criar` não tem nenhum `<h1>`

**Severidade:** baixa
**Onde:** `/criar`, DOM depois da hidratação
**Teste:** `tests/smoke.spec.ts` → "a tela /criar deveria ter uma h1"

**Passos**

1. Abrir `https://presenteiapp.com.br/criar`
2. Aguardar a hidratação
3. `document.querySelectorAll('h1').length`

**Esperado:** ≥ 1
**Obtido:** `0`

**Impacto:** leitor de tela não anuncia o título da tela principal do produto.
A página também herda o `<title>` da home, então usuário com várias abas
abertas não distingue uma da outra.

---

## PRE-003 — O card de ocasião na home leva para destino diferente do seu `href`

**Severidade:** média
**Onde:** home, cards de ocasião (`a[href="/ocasiao/namoro"]` etc.)
**Teste:** `tests/navegacao.spec.ts` → "o destino do clique bate com o href do card de ocasião"

**Passos**

1. Abrir `https://presenteiapp.com.br/`
2. Rolar até os cards de ocasião
3. Clicar no card "namoro"

**Esperado:** ir para `/ocasiao/namoro` (o que o `href` promete)
**Obtido:** vai para `/criar` — o clique é interceptado pela SPA

**Impacto:** o destino muda conforme a forma de clicar. Clique normal vai para
`/criar`; botão do meio, "abrir em nova aba" e o crawler vão para
`/ocasiao/namoro`. Duas experiências diferentes para o mesmo elemento.

**Observação:** pode ser comportamento intencional (o card significa "criar um
presente desta ocasião"). Se for, o defeito está no `href`, não no handler — o
correto seria `href="/criar?ocasiao=namoro"`. De um jeito ou de outro, os dois
precisam concordar.

---

## Sem defeito — verificado e conforme

- Cabeçalhos de segurança completos: CSP com `default-src 'self'` e
  `script-src 'self'`, HSTS de 31.536.000s, `nosniff`, `X-Frame-Options:
  SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` negando câmera, microfone e localização
- Nenhum `X-Powered-By` exposto
- Todas as 8 URLs do `sitemap.xml` respondem 200
- `robots.txt` bloqueia `/api/` e `/p/` (páginas de presente não indexáveis)
- Home sem erro de console e sem requisição 4xx/5xx
- Home com exatamente um `<h1>`
- As 6 páginas de ocasião têm `canonical` próprio, `<h1>` preenchido, `<title>`
  distinto do da home e CTA como `<a href="/criar">` no HTML servido
