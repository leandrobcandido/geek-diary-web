// ============================================================================
// INTERFACE (O esqueleto dos dados que vêm da API)
// ============================================================================
export interface TMDBMovie {
  id: number;
  title: string;
  originalTitle: string;
  releaseDate: Date | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  runtime: number | null;
  genres: string[];
  status: string | null;
}

// ============================================================================
// CONVERSORES E UTILITÁRIOS
// ============================================================================

/**
 * Instancia o modelo a partir de um objeto JSON bruto retornado pela API.
 */
export const parseTMDBMovieFromJson = (json: any): TMDBMovie => {
  // Converte de forma segura a string de data retornada pela API
  const parseDate = (dateStr?: string): Date | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    try {
      // Adiciona T00:00:00 para forçar a leitura correta do fuso horário local
      const date = new Date(`${dateStr}T00:00:00`);
      return isNaN(date.getTime()) ? null : date;
    } catch (_) {
      return null;
    }
  };

  return {
    id: json.id || 0,
    title: json.title || 'Sem título',
    originalTitle: json.original_title || '',
    releaseDate: parseDate(json.release_date),
    posterPath: json.poster_path || null,
    backdropPath: json.backdrop_path || null,
    overview: json.overview || '',
    runtime: json.runtime || null,
    genres: Array.isArray(json.genres)
      ? json.genres.map((g: any) => (g.name ? String(g.name) : String(g)))
      : [],
    status: json.status || null
  };
};