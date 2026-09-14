# presentei-e2e

Suíte de testes end-to-end e de regressão do [Presentei](https://presenteiapp.com.br),
plataforma de presente digital em que a pessoa presenteada joga um mini-jogo para
abrir a surpresa.

Escrita em **Playwright + TypeScript**, roda contra produção e no CI.

**Estado atual:** 30 casos, executados em 2 navegadores (Chromium desktop e
Pixel 7) = 60 execuções, todas passando. Três dessas são defeitos conhecidos e
documentados — ver [RELATORIO-DEFEITOS.md](RELATORIO-DEFEITOS.md).

```
Running 60 tests using 4 workers
  60 passed (54.2s)
```

---

## Como rodar

```bash
npm ci
npx playwright install --with-deps chromium
npx playwright test
npx playwright show-report
```

Para apontar para outro ambiente:

```bash
BASE_URL=http://localhost:8000 npx playwright test
```

---

## O que a suíte cobre

| Arquivo | O que trava |
|---|---|
| `smoke.spec.ts` | Home, `/criar` e `/privacidade` sobem com 200 e renderizam. Home sem erro de console e sem requisição 4xx/5xx. Uma única `<h1>` na home. |
| `seguranca-headers.spec.ts` | CSP, HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Nenhum `X-Powered-By`. |
| `seo-ocasioes.spec.ts` | As 6 páginas de ocasião: `canonical` próprio, `<h1>` preenchido, `<title>` distinto do da home e CTA como `<a href>` rastreável. |
| `sitemap.spec.ts` | Toda URL anunciada no `sitemap.xml` responde 200; o sitemap cobre as rotas que o código conhece; `robots.txt` bloqueia `/api/` e `/p/`. |
| `navegacao.spec.ts` | Cards de ocasião presentes e clicáveis, caminho até `/criar`, política de privacidade alcançável. |

## Uma decisão de arquitetura que vale explicar

O Presentei serve um **shell de pré-render** (`#seo-prerender`) para quem não
executa JavaScript, e o React remove esse shell quando hidrata. São dois DOMs
diferentes na mesma URL.

Por isso a suíte é dividida por leitor:

- os testes de **SEO** leem o HTML cru via `request` — é exatamente o que o
  crawler enxerga;
- os testes de **navegação** leem o DOM hidratado via `page` — é o que o usuário
  enxerga.

A primeira versão desta suíte misturou os dois e quebrou em 20 casos. O erro
não foi do site: era o teste procurando `a.cta` num DOM onde o React já tinha
substituído o link por um `<button>`.

## Defeitos conhecidos ficam no repositório, não no Slack

Os três defeitos abertos têm teste próprio marcado com `test.fail()`. Isso faz
duas coisas ao mesmo tempo: a CI continua verde enquanto o defeito existe, e o
Playwright **avisa no dia em que ele for corrigido** ("expected to fail, but
passed"). Defeito conhecido vira teste, não vira comentário perdido.

## CI

`.github/workflows/e2e.yml` roda a suíte em push, em pull request e todo dia
às 09:00 BRT — produção muda sem passar por PR (deploy, CDN, DNS), então o
agendamento pega o que o PR não pega. O relatório HTML fica como artifact por
14 dias.

---

## O que esta suíte NÃO cobre

Vale dizer com clareza, porque suíte que promete demais é pior que suíte curta:

- **Fluxo de pagamento.** Não há teste de checkout. Testar pagamento em
  produção gera cobrança real; precisa de ambiente de sandbox do provedor.
- **Criação completa de um presente.** O editor em `/criar` grava no banco de
  produção. Falta um ambiente de testes com dados descartáveis.
- **Os mini-jogos.** Canvas e interação por toque pedem estratégia própria
  (comparação visual ou testes unitários da engine), não E2E de fluxo.
- **Rate limiting.** Está implementado, mas exercitá-lo em produção significa
  disparar o bloqueio contra a própria infraestrutura. Fica para o ambiente de
  staging.
- **Regressão visual.** Nenhum snapshot de imagem. A suíte verifica estrutura e
  comportamento, não aparência.
- **Compatibilidade com Firefox e Safari.** Só Chromium hoje, para manter o CI
  rápido. Ampliar é uma linha no `playwright.config.ts`.

## Nota sobre TLS

`PW_INSECURE_TLS=1` existe só para redes com proxy TLS corporativo, onde o
certificado do proxy não é reconhecido pelo Chromium. Não usar em CI nem no dia
a dia: a flag mascara certificado inválido de verdade.
