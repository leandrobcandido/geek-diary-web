import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MediaListPage from '@/pages/MediaListPage';
import { type MediaListItem } from '@/types/mediaListItem';
import { parseFirebaseDate } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/authContext';
import { getMoviesByYear, getSeriesByYear } from '@/services/firebase/databaseService';
import { useDashboardStore } from '@/hooks/useDashboardData'; 

export default function MediaListContainer() {
  const { currentUser } = useAuth();
  const { mediaType, year: urlYear } = useParams();
  const navigate = useNavigate();

  const year = Number(urlYear) || new Date().getFullYear();
  const isMovieType = mediaType === 'movies';
  const typeTitle = isMovieType ? 'Filmes' : 'Séries';
  const mediaTypeSlug = isMovieType ? 'movies' : 'series';

  const { yearMovies, yearSeries } = useDashboardStore();
  
  const cachedItems = isMovieType ? yearMovies[year] : yearSeries[year];
  
  const [items, setItems] = useState<any[]>(cachedItems || []);
  const [isLoading, setIsLoading] = useState(!cachedItems || cachedItems.length === 0);

  useEffect(() => {
    async function resolveItems() {
      if (!currentUser) return;

      // Se já temos no cache global, não fazemos nada (abertura instantânea!)
      if (cachedItems && cachedItems.length > 0) {
        setItems(cachedItems);
        setIsLoading(false);
        return;
      }

      // Se por acaso não estiver no cache (ex: acesso direto por link), buscamos
      setIsLoading(true);
      try {
        const data = isMovieType 
          ? await getMoviesByYear(currentUser.uid, year)
          : await getSeriesByYear(currentUser.uid, year);
        
        setItems(data);
      } catch (error) {
        console.error("Erro ao buscar lista do ano:", error);
      } finally {
        setIsLoading(false);
      }
    }

    resolveItems();
  }, [currentUser, mediaType, year, isMovieType, cachedItems]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app-bg">
        <div className="w-10 h-10 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const mappedItems: MediaListItem[] = items.map(item => {
    const title = 'title' in item ? item.title : (item as any).name;
    const originalTitle = 'originalTitle' in item ? item.originalTitle : (item as any).originalName;

    return {
      id: item.id || Math.random().toString(), 
      title: title || 'Sem Título',
      originalTitle: originalTitle,
      posterPath: item.posterPath,
      watchedDate: parseFirebaseDate(item.watchedDate),
      userRating: item.userRating || 0,
      rawItem: item 
    };
  });

  return (
    <MediaListPage
      year={year}
      typeTitle={typeTitle}
      items={mappedItems}
      onBack={() => navigate(-1)}
      onAddClick={() => navigate(`/search/${mediaTypeSlug}/${year}`)}
      onItemClick={(item) => navigate(`/detail/${mediaTypeSlug}/${year}/${item.id}`)}
    />
  );
}