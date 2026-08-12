import { Timestamp } from "firebase/firestore";
import type { TMDBMovie } from "./tmdbMovie";

// ============================================================================
// INTERFACE (O esqueleto dos dados)
// ============================================================================
export interface Movie {
  id?: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  releaseDate: Date | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  runtime: number | null;
  genres: string[];
  status: string | null;
  watchedDate: Date;
  watchedYear: number;
  userRating: number;
}

// ============================================================================
// CONVERSORES (Funções puras que substituem as Factories do Dart)
// ============================================================================

/**
 * Prepara o objeto Movie local para ser salvo no Firestore.
 */
export const movieToFirestore = (movie: Movie): Record<string, any> => {
  return {
    tmdbId: movie.tmdbId,
    title: movie.title,
    originalTitle: movie.originalTitle,
    releaseDate: movie.releaseDate ? Timestamp.fromDate(movie.releaseDate) : null,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    overview: movie.overview,
    runtime: movie.runtime,
    genres: movie.genres,
    status: movie.status,
    watchedDate: Timestamp.fromDate(movie.watchedDate),
    watchedYear: movie.watchedYear,
    userRating: movie.userRating,
  };
};

/**
 * Pega o documento bruto do Firestore e converte para o formato rigoroso do nosso Movie.
 * Equivalente ao factory Movie.fromFirestore()
 */
export const parseMovieFromFirestore = (id: string, data: any): Movie => {
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
    title: data.title || 'Sem título',
    originalTitle: data.originalTitle || '',
    releaseDate: parseDate(data.releaseDate),
    posterPath: data.posterPath || null,
    backdropPath: data.backdropPath || null,
    overview: data.overview || '',
    runtime: data.runtime || null,
    genres: data.genres || [],
    status: data.status || null,
    watchedDate: parsedWatchedDate,
    watchedYear: data.watchedYear || parsedWatchedDate.getFullYear(),
    userRating: data.userRating || 0,
  };
};

/**
 * Transforma a resposta crua da API do TMDB em um filme pronto para o nosso diário.
 */
export const createMovieFromTMDB = (tmdb: TMDBMovie, watchedDate: Date, userRating: number): Movie => {
  return {
    tmdbId: tmdb.id,
    title: tmdb.title,
    originalTitle: tmdb.originalTitle,
    releaseDate: tmdb.releaseDate,
    posterPath: tmdb.posterPath,
    backdropPath: tmdb.backdropPath,
    overview: tmdb.overview,
    runtime: tmdb.runtime,
    genres: tmdb.genres,
    status: tmdb.status,
    watchedDate: watchedDate,
    watchedYear: watchedDate.getFullYear(),
    userRating: userRating,
  };
};