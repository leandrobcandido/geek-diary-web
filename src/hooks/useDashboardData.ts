import { useEffect } from 'react';
import { create } from 'zustand';
import { useAuth } from '@/contexts/authContext';
import {  
  getMoviesByYear, 
  getSeriesByYear, 
  ensureUserExists,
  getUser
} from '@/services/firebase/databaseService';
import type { Movie, Series } from '@/types';

// ============================================================================
// 1. A NOSSA LOJA GLOBAL (ZUSTAND STORE)
// ============================================================================
interface DashboardState {
  isLoading: boolean;
  initialLoadDone: boolean;
  availableYears: number[];
  referenceYear: number;
  desktopVisibleCount: number;
  yearMovies: Record<number, Movie[]>;
  yearSeries: Record<number, Series[]>;
  fetchedYears: number[];

  // 🔥 NOVOS CAMPOS: Para a nova HomePage super rápida!
  summaryMovies: Record<number, any>;
  summarySeries: Record<number, any>;

  setReferenceYear: (year: number) => void;
  setDesktopVisibleCount: (updater: number | ((prev: number) => number)) => void;
  fetchMediaForYear: (year: number, uid: string) => Promise<void>;
  processInitialData: (user: any) => Promise<void>;
  
  // 🔥 SOLUÇÃO DO BUG: Função para forçar atualização do cache após salvar/deletar
  forceRefreshYear: (year: number, uid: string) => Promise<void>;
  
  resetStore: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  isLoading: true,
  initialLoadDone: false,
  availableYears: [],
  referenceYear: new Date().getFullYear(),
  desktopVisibleCount: 3,
  yearMovies: {},
  yearSeries: {},
  fetchedYears: [],
  summaryMovies: {},
  summarySeries: {},

  setReferenceYear: (year) => set({ referenceYear: year }),

  setDesktopVisibleCount: (updater) => {
    if (typeof updater === 'function') {
      set((state) => ({ desktopVisibleCount: updater(state.desktopVisibleCount) }));
    } else {
      set({ desktopVisibleCount: updater });
    }
  },

  fetchMediaForYear: async (year, uid) => {
    const { fetchedYears } = get();
    if (fetchedYears.includes(year)) return;
    set({ fetchedYears: [...fetchedYears, year] });

    try {
      const [movies, series] = await Promise.all([
        getMoviesByYear(uid, year),
        getSeriesByYear(uid, year)
      ]);
      set((state) => ({
        yearMovies: { ...state.yearMovies, [year]: movies },
        yearSeries: { ...state.yearSeries, [year]: series }
      }));
    } catch (error) {
      console.error(`Erro ao buscar dados do ano ${year}:`, error);
      set((state) => ({
        fetchedYears: state.fetchedYears.filter(y => y !== year),
        yearMovies: { ...state.yearMovies, [year]: [] },
        yearSeries: { ...state.yearSeries, [year]: [] }
      }));
    }
  },

  forceRefreshYear: async (year, uid) => {
    try {
      // Busca os filmes, séries e o documento do usuário atualizado (com os novos sumários)
      const [movies, series, userData] = await Promise.all([
        getMoviesByYear(uid, year),
        getSeriesByYear(uid, year),
        getUser(uid)
      ]);

      set((state) => ({
        yearMovies: { ...state.yearMovies, [year]: movies },
        yearSeries: { ...state.yearSeries, [year]: series },
        summaryMovies: userData.summaryMovies || state.summaryMovies,
        summarySeries: userData.summarySeries || state.summarySeries,
        availableYears: userData.availableYears?.length > 0 ? userData.availableYears : state.availableYears
      }));
    } catch (error) {
      console.error(`Erro ao forçar refresh do ano ${year}:`, error);
    }
  },

  processInitialData: async (user) => {
    const { initialLoadDone, fetchMediaForYear } = get();
    if (initialLoadDone) return;
    set({ isLoading: true });

    try {
      await ensureUserExists(user.uid, user.email || '', user.name || '');
      
      // 🔥 Buscamos o usuário para pegar a nova estrutura de sumários!
      const userData = await getUser(user.uid);
      const years = userData.availableYears || [];
      const currentCalendarYear = new Date().getFullYear();
      const validYears = years.length > 0 ? years : [currentCalendarYear];
      
      const initialYear = validYears.includes(currentCalendarYear) 
        ? currentCalendarYear 
        : validYears[validYears.length - 1];
        
      set({ 
        availableYears: validYears.sort((a: number, b: number) => a - b),
        referenceYear: initialYear,
        summaryMovies: userData.summaryMovies || {},
        summarySeries: userData.summarySeries || {}
      });
      
      await fetchMediaForYear(initialYear, user.uid);
      set({ initialLoadDone: true });
    } catch (error) {
      console.error("Erro ao processar dados iniciais:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => set({
    isLoading: true,
    initialLoadDone: false,
    availableYears: [],
    referenceYear: new Date().getFullYear(),
    desktopVisibleCount: 3,
    yearMovies: {},
    yearSeries: {},
    fetchedYears: [],
    summaryMovies: {},
    summarySeries: {}
  })
}));

// ============================================================================
// 2. O HOOK CONECTOR
// ============================================================================
export function useDashboardData() {
  const { currentUser } = useAuth();
  const store = useDashboardStore();
  
  useEffect(() => {
    if (currentUser) {
      store.processInitialData(currentUser);
    }
  }, [currentUser]); 

  const sortedYearsDesc = [...store.availableYears].sort((a, b) => b - a);
  const visibleDesktopYears = sortedYearsDesc.slice(0, store.desktopVisibleCount);
  const visibleYearsString = visibleDesktopYears.join(',');

  useEffect(() => {
    if (currentUser) {
      if (store.referenceYear) {
        store.fetchMediaForYear(store.referenceYear, currentUser.uid);
      }
      visibleDesktopYears.forEach(year => store.fetchMediaForYear(year, currentUser.uid));
    }
  }, [visibleYearsString, store.referenceYear, currentUser]);

  return {
    isLoading: store.isLoading,
    availableYears: store.availableYears,
    referenceYear: store.referenceYear,
    setReferenceYear: store.setReferenceYear,
    desktopVisibleCount: store.desktopVisibleCount,
    setDesktopVisibleCount: store.setDesktopVisibleCount,
    yearMovies: store.yearMovies,
    yearSeries: store.yearSeries,
    
    // 🔥 Exportamos os sumários para a HomePage usar no próximo passo!
    summaryMovies: store.summaryMovies,
    summarySeries: store.summarySeries,
    
    sortedYearsDesc,
    visibleDesktopYears,
    fetchMediaForYear: (year: number) => store.fetchMediaForYear(year, currentUser?.uid || '')
  };
}