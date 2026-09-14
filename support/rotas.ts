/**
 * Rotas publicas do Presentei.
 * Fonte: https://presenteiapp.com.br/sitemap.xml (conferido em 14/09/2026).
 * Se o sitemap mudar, sitemap.spec.ts acusa a divergencia.
 */

export const OCASIOES = [
  'namoro',
  'aniversario',
  'desculpas',
  'natal',
  'halloween',
  'casamento',
] as const;

export const rotaOcasiao = (slug: string) => `/ocasiao/${slug}/`;

export const ROTAS_ESTATICAS = ['/', '/criar', '/privacidade'] as const;

/** Slug que nao existe — usado para checar o tratamento de rota invalida. */
export const OCASIAO_INEXISTENTE = 'slug-que-nao-existe-9f2a';
