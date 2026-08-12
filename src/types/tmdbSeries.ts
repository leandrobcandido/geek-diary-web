import { type TMDBSeason, parseTMDBSeasonFromJson } from "./tmdbSeason";

// ============================================================================
// INTERFACE (O esqueleto dos dados da Série vindo da API)
// ============================================================================
export interface TMDBSeries {
  id: number;
  name: string;
  originalName: string;
  totalSeasons: number;
  firstAirDate: Date | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  status: string | null;
  genres: string[];
  seasons: TMDBSeason[];
}

// ============================================================================
// CONVERSORES E UTILITÁRIOS
// ============================================================================

/**
 * Instancia o modelo a partir de um objeto JSON bruto retornado pela API.
 * Equivalente ao factory TMDBSeries.fromJson()
 */
export const parseTMDBSeriesFromJson = (json: any): TMDBSeries => {
  // Converte de forma segura a string de data retornada pela API
  const parseDate = (dateStr?: string): Date | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    try {
      const date = new Date(`${dateStr}T00:00:00`);
      return isNaN(date.getTime()) ? null : date;
    } catch (_) {
      return null;
    }
  };

  // Mapeia e filtra as temporadas (removendo a Temporada 0 de Especiais)
  const rawSeasons: any[] = Array.isArray(json.seasons) ? json.seasons : [];
  const parsedSeasons = rawSeasons
    .map((s) => parseTMDBSeasonFromJson(s))
    .filter((s) => s.seasonNumber > 0);

  return {
    id: json.id || 0,
    name: json.name || 'Sem nome',
    originalName: json.original_name || '',
    totalSeasons: json.number_of_seasons ?? 0,
    firstAirDate: parseDate(json.first_air_date),
    posterPath: json.poster_path || null,
    backdropPath: json.backdrop_path || null,
    overview: json.overview || '',
    status: json.status || null,
    
    // Mapeia os nomes dos gêneros de forma segura
    genres: Array.isArray(json.genres)
      ? json.genres.map((g: any) => (g.name ? String(g.name) : String(g)))
      : [],
      
    seasons: parsedSeasons,
  };
};