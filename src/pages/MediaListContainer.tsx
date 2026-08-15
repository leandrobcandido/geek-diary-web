import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MediaListPage from '@/pages/MediaListPage';
import { type MediaListItem } from '@/types/mediaListItem';
import { parseFirebaseDate } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/authContext';
import { useDashboardStore } from '@/hooks/useDashboardData'; 

export default function MediaListContainer() {
  const { currentUser } = useAuth();
  const { mediaType, year: urlYear } = useParams();
  const navigate = useNavigate();

  const year = Number(urlYear) || new Date().getFullYear();
  const isMovieType = mediaType === 'movies';
  const typeTitle = isMovieType ? 'Filmes' : 'Séries';
  const mediaTypeSlug = isMovieType ? 'movies' : 'series';

  // 🔥 Puxamos tudo do Zustand. Ele é a nossa única fonte de verdade agora!
  const { yearMovies, yearSeries, fetchedYears, fetchMediaForYear } = useDashboardStore();
  
  // O Zustand sabe exatamente se esse ano já foi baixado ou não
  const isDataLoaded = fetchedYears.includes(year);
  const rawItems = isMovieType ? (yearMovies[year] || []) : (yearSeries[year] || []);

  useEffect(() => {
    // Se o usuário está logado e o Zustand ainda não baixou os dados desse ano, mandamos ele baixar!
    if (currentUser && !isDataLoaded) {
      fetchMediaForYear(year, currentUser.uid);
    }
  }, [currentUser, year, isDataLoaded, fetchMediaForYear]);

  // Exibe o loading enquanto o Zustand trabalha
  if (!isDataLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app-bg">
        <div className="w-10 h-10 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Mapeia os dados brutos para o formato que a lista visual espera
  const mappedItems: MediaListItem[] = rawItems.map(item => {
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