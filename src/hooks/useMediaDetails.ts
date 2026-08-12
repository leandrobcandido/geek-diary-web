import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovieDetails, getSeriesDetails } from '@/services/tmdb/tmdbService';
import type { TMDBMovie } from '@/types/tmdbMovie';
import type { TMDBSeries } from '@/types/tmdbSeries';

export function useMediaDetails(id: string | undefined, isMovie: boolean) {
  const navigate = useNavigate();
  // Estado fortemente tipado com as suas interfaces
  const [richMedia, setRichMedia] = useState<TMDBMovie | TMDBSeries | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  useEffect(() => {
    async function loadRichDetails() {
      if (!id) return;
      setIsLoadingDetails(true);
      
      try {
        if (isMovie) {
          const data = await getMovieDetails(Number(id)); // Retorna TMDBMovie
          setRichMedia(data);
        } else {
          const data = await getSeriesDetails(Number(id)); // Retorna TMDBSeries
          if (data.seasons && data.seasons.length > 0) {
            setSelectedSeasonId(data.seasons[0].id);
          }
          setRichMedia(data);
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes ricos:", error);
        alert("Não foi possível obter os detalhes completos da mídia.");
        navigate(-1);
      } finally {
        setIsLoadingDetails(false);
      }
    }
    
    loadRichDetails();
  }, [id, isMovie, navigate]);

  return { 
    richMedia, 
    isLoadingDetails, 
    selectedSeasonId, 
    setSelectedSeasonId 
  };
}