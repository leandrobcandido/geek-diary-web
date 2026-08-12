import { Timestamp } from "firebase/firestore";
import type { TMDBSeries } from "./tmdbSeries";
import type { TMDBSeason } from "./tmdbSeason";

// ============================================================================
// INTERFACE (O esqueleto dos dados salvos no Firebase)
// ============================================================================
export interface Series {
  id?: string;
  tmdbId: number;
  seasonTmdbId: number;
  name: string;
  originalName: string;
  seasonName: string;
  seasonNumber: number;
  totalSeasons: number;
  firstAirDate: Date | null;
  seasonAirDate: Date | null;
  posterPath: string | null;
  seasonPosterPath: string | null;
  backdropPath: string | null;
  overview: string;
  seasonOverview: string;
  genres: string[];
  watchedDate: Date;
  watchedYear: number;
  userRating: number;
  status: string | null;
}

// ============================================================================
// CONVERSORES
// ============================================================================

/**
 * Prepara o objeto Series local para ser salvo no Firestore.
 */
export const seriesToFirestore = (series: Series): Record<string, any> => {
  return {
    tmdbId: series.tmdbId,
    seasonTmdbId: series.seasonTmdbId,
    name: series.name,
    originalName: series.originalName,
    seasonName: series.seasonName,
    seasonNumber: series.seasonNumber,
    totalSeasons: series.totalSeasons,
    firstAirDate: series.firstAirDate ? Timestamp.fromDate(series.firstAirDate) : null,
    seasonAirDate: series.seasonAirDate ? Timestamp.fromDate(series.seasonAirDate) : null,
    posterPath: series.posterPath,
    seasonPosterPath: series.seasonPosterPath,
    backdropPath: series.backdropPath,
    overview: series.overview,
    seasonOverview: series.seasonOverview,
    genres: series.genres,
    watchedDate: Timestamp.fromDate(series.watchedDate),
    watchedYear: series.watchedYear,
    userRating: series.userRating,
    status: series.status,
  };
};

/**
 * Pega o documento bruto do Firestore e converte para o formato rigoroso.
 */
export const parseSeriesFromFirestore = (id: string, data: any): Series => {
  // Função auxiliar interna para garantir a conversão segura de datas
  const parseDate = (dateVal: any): Date | null => {
    if (dateVal instanceof Timestamp) return dateVal.toDate();
    if (typeof dateVal === 'string') return new Date(dateVal);
    return null;
  };

  const parsedWatchedDate = parseDate(data.watchedDate) || new Date();

  return {
    id: id,
    tmdbId: data.tmdbId || 0,
    seasonTmdbId: data.seasonTmdbId || 0,
    name: data.name || 'Sem nome',
    originalName: data.originalName || '',
    seasonName: data.seasonName || '',
    seasonNumber: data.seasonNumber ?? 0,
    totalSeasons: data.totalSeasons ?? 0,
    firstAirDate: parseDate(data.firstAirDate),
    seasonAirDate: parseDate(data.seasonAirDate),
    posterPath: data.posterPath || null,
    seasonPosterPath: data.seasonPosterPath || null,
    backdropPath: data.backdropPath || null,
    overview: data.overview || '',
    seasonOverview: data.seasonOverview || '',
    genres: data.genres || [],
    watchedDate: parsedWatchedDate,
    watchedYear: data.watchedYear || parsedWatchedDate.getFullYear(),
    userRating: data.userRating || 0,
    status: data.status || null,
  };
};

/**
 * Transforma a resposta crua da API do TMDB em uma temporada pronta para o nosso diário.
 */
export const createSeriesFromTMDB = (
  series: TMDBSeries, 
  season: TMDBSeason, 
  watchedDate: Date, 
  userRating: number
): Series => {
  return {
    tmdbId: series.id,
    seasonTmdbId: season.id,
    name: series.name,
    originalName: series.originalName,
    seasonName: season.name,
    seasonNumber: season.seasonNumber,
    totalSeasons: series.totalSeasons,
    firstAirDate: series.firstAirDate,
    seasonAirDate: season.airDate,
    posterPath: series.posterPath,
    seasonPosterPath: season.posterPath,
    backdropPath: series.backdropPath,
    overview: series.overview,
    seasonOverview: season.overview,
    genres: series.genres,
    watchedDate: watchedDate,
    watchedYear: watchedDate.getFullYear(),
    userRating: userRating,
    status: series.status,
  };
};