import { type TMDBMovie, type TMDBSeries } from '../../types';
import { parseTMDBMovieFromJson } from '../../types/tmdbMovie';
import { parseTMDBSeriesFromJson } from '../../types/tmdbSeries';

// ============================================================================
// CONFIGURAÇÕES BASE
// ============================================================================
// O Vite lê a chave automaticamente do arquivo .env
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verifica se uma data de lançamento já aconteceu (é igual ou menor que o dia de hoje).
 * Essa função testa o JSON bruto do TMDB antes da conversão, portanto usa string.
 */
const isReleased = (dateString?: string): boolean => {
  if (!dateString || dateString.trim() === '') return false;
  
  // Adiciona T00:00:00 para garantir que o JS leia como meia-noite local, evitando bugs de fuso horário
  const releaseDate = new Date(`${dateString}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas o dia
  
  return releaseDate.getTime() <= now.getTime();
};

// ============================================================================
// SERVIÇOS DE BUSCA
// ============================================================================

export const searchMovies = async (query: string): Promise<TMDBMovie[]> => {
  if (!query.trim()) return [];

  const url = new URL(`${TMDB_BASE_URL}/search/movie`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  url.searchParams.append('query', query);
  url.searchParams.append('language', 'pt-BR');

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Erro na API TMDB: ${response.status}`);
    }

    const data = await response.json();
    const rawResults = data.results || [];

    // Filtra no formato bruto e mapeia para o nosso Tipo rigoroso
    return rawResults
      .filter((movie: any) => isReleased(movie.release_date))
      .map((movie: any) => parseTMDBMovieFromJson(movie)); 
      
  } catch (e) {
    throw new Error(`Falha na conexão ao buscar filmes: ${e}`);
  }
};

export const getMovieDetails = async (id: number): Promise<TMDBMovie> => {
  const url = new URL(`${TMDB_BASE_URL}/movie/${id}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  url.searchParams.append('language', 'pt-BR');

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Erro na API TMDB: ${response.status}`);
    }

    const data = await response.json();
    
    // Converte e retorna
    return parseTMDBMovieFromJson(data);
  } catch (e) {
    throw new Error(`Erro ao carregar detalhes do filme: ${e}`);
  }
};

export const searchSeries = async (query: string): Promise<TMDBSeries[]> => {
  if (!query.trim()) return [];

  const url = new URL(`${TMDB_BASE_URL}/search/tv`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  url.searchParams.append('query', query);
  url.searchParams.append('language', 'pt-BR');

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Erro na API TMDB: ${response.status}`);
    }

    const data = await response.json();
    const rawResults = data.results || [];

    // Filtra no formato bruto e mapeia para o nosso Tipo rigoroso
    return rawResults
      .filter((series: any) => isReleased(series.first_air_date))
      .map((series: any) => parseTMDBSeriesFromJson(series));
      
  } catch (e) {
    throw new Error(`Falha na conexão ao buscar séries: ${e}`);
  }
};

export const getSeriesDetails = async (id: number): Promise<TMDBSeries> => {
  const url = new URL(`${TMDB_BASE_URL}/tv/${id}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  url.searchParams.append('language', 'pt-BR');

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Erro na API TMDB: ${response.status}`);
    }

    const data = await response.json();

    // Filtra internamente as temporadas no JSON bruto antes de converter a série
    if (data.seasons && Array.isArray(data.seasons)) {
      data.seasons = data.seasons.filter((season: any) => isReleased(season.air_date));
    }

    // Converte e retorna
    return parseTMDBSeriesFromJson(data);
  } catch (e) {
    throw new Error(`Erro ao carregar detalhes da série: ${e}`);
  }
};