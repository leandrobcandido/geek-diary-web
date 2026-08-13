import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/authContext';
import { 
  getAvailableYears, 
  getMoviesByYear, 
  getSeriesByYear, 
  ensureUserExists 
} from '@/services/firebase/databaseService';
import type { Movie, Series } from '@/types';

export function useDashboardData() {
  const { currentUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [availableYears] = useState<number[]>([]);
  const [referenceYear, setReferenceYear] = useState<number>(new Date().getFullYear());
  const [desktopVisibleCount, setDesktopVisibleCount] = useState<number>(3);
  
  const [yearMovies, setYearMovies] = useState<Record<number, Movie[]>>({});
  const [yearSeries, setYearSeries] = useState<Record<number, Series[]>>({});

  const fetchedYears = useRef<Set<number>>(new Set());

  const fetchMediaForYear = useCallback(async (year: number) => {
    if (!currentUser || fetchedYears.current.has(year)) return;
    
    fetchedYears.current.add(year);

    try {
      const [movies, series] = await Promise.all([
        getMoviesByYear(currentUser.uid, year),
        getSeriesByYear(currentUser.uid, year)
      ]);

      setYearMovies(prev => ({ ...prev, [year]: movies }));
      setYearSeries(prev => ({ ...prev, [year]: series }));
    } catch (error) {
      console.error(`Erro ao buscar dados do ano ${year}:`, error);
      fetchedYears.current.delete(year);
      setYearMovies(prev => ({ ...prev, [year]: [] }));
      setYearSeries(prev => ({ ...prev, [year]: [] }));
    }
  }, [currentUser]); 

  const processInitialData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);

    try {
      ensureUserExists(currentUser.uid, currentUser.email, currentUser.name)
        .catch(err => console.error("Erro silencioso ao garantir usuário:", err));

      const years = await getAvailableYears(currentUser.uid);
      const validYears = years.length > 0 ? years : [new Date().getFullYear()];
      
      const currentCalendarYear = new Date().getFullYear();
      const initialYear = validYears.includes(currentCalendarYear) 
        ? currentCalendarYear 
        : validYears[validYears.length - 1];
        
      setReferenceYear(initialYear);
      await fetchMediaForYear(initialYear);
    } catch (error) {
      console.error("Erro ao processar dados iniciais:", error);
    } finally {
      setIsLoading(false); // Libera a tela muito mais rápido!
    }
  }, [currentUser, fetchMediaForYear]);

  useEffect(() => {
    processInitialData();
  }, [processInitialData]);

  const sortedYearsDesc = [...availableYears].sort((a, b) => b - a);
  const visibleDesktopYears = sortedYearsDesc.slice(0, desktopVisibleCount);
  const visibleYearsString = visibleDesktopYears.join(',');

  useEffect(() => {
    visibleDesktopYears.forEach(year => fetchMediaForYear(year));
  }, [visibleYearsString, fetchMediaForYear]);

  return {
    isLoading,
    availableYears,
    referenceYear,
    setReferenceYear,
    desktopVisibleCount,
    setDesktopVisibleCount,
    yearMovies,
    yearSeries,
    sortedYearsDesc,
    visibleDesktopYears,
    fetchMediaForYear
  };
}