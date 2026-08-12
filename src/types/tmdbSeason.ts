// ============================================================================
// INTERFACE (O esqueleto dos dados que vêm da API)
// ============================================================================
export interface TMDBSeason {
  id: number;
  name: string;
  posterPath: string | null;
  seasonNumber: number;
  episodeCount: number;
  airDate: Date | null;
  overview: string;
}

// ============================================================================
// CONVERSORES E UTILITÁRIOS
// ============================================================================

/**
 * Instancia o modelo a partir de um objeto JSON bruto retornado pela API.
 */
export const parseTMDBSeasonFromJson = (json: any): TMDBSeason => {
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
    name: json.name || 'Sem título',
    posterPath: json.poster_path || null,
    seasonNumber: json.season_number ?? 0, 
    episodeCount: json.episode_count ?? 0,
    airDate: parseDate(json.air_date),
    overview: json.overview || ''
  };
};