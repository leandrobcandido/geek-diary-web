// ============================================================================
// TYPE (Define os valores estritos permitidos)
// ============================================================================
export type MediaType = 'movie' | 'series';

// ============================================================================
// DICIONÁRIO DE RÓTULOS (Para exibição na interface)
// ============================================================================
export const mediaTypeLabels: Record<MediaType, string> = {
  movie: 'Filme',
  series: 'Série',
};