import { useEffect } from 'react';
import { create } from 'zustand';
import { useAuth } from '@/contexts/authContext';
import { 
  getAvailableYears, 
  getMoviesByYear, 
  getSeriesByYear, 
  ensureUserExists 
} from '@/services/firebase/databaseService';
import type { Movie, Series } from '@/types';

// ============================================================================
// 1. A NOSSA LOJA GLOBAL (ZUSTAND STORE)
// Os dados aqui sobrevivem às trocas de página e não sofrem amnésia!
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

  // Ações
  setReferenceYear: (year: number) => void;
  setDesktopVisibleCount: (updater: number | ((prev: number) => number)) => void;
  fetchMediaForYear: (year: number, uid: string) => Promise<void>;
  processInitialData: (user: any) => Promise<void>;
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

  setReferenceYear: (year) => set({ referenceYear: year }),

  // Suporta tanto receber um número direto quanto uma função prev => prev + 3
  setDesktopVisibleCount: (updater) => {
    if (typeof updater === 'function') {
      set((state) => ({ desktopVisibleCount: updater(state.desktopVisibleCount) }));
    } else {
      set({ desktopVisibleCount: updater });
    }
  },

  fetchMediaForYear: async (year, uid) => {
    const { fetchedYears } = get();
    
    // Se o ano já foi buscado e está na memória global, não faz nada!
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
        fetchedYears: state.fetchedYears.filter(y => y !== year), // Remove em caso de erro
        yearMovies: { ...state.yearMovies, [year]: [] },
        yearSeries: { ...state.yearSeries, [year]: [] }
      }));
    }
  },

  processInitialData: async (user) => {
    const { initialLoadDone, fetchMediaForYear } = get();
    
    // Se os dados iniciais já foram carregados nesta sessão, liberamos a tela instantaneamente!
    if (initialLoadDone) return;
    
    set({ isLoading: true });

    try {
      await ensureUserExists(user.uid, user.email || '', user.name || '');
      
      const years = await getAvailableYears(user.uid);
      const currentCalendarYear = new Date().getFullYear();
      const validYears = years.length > 0 ? years : [currentCalendarYear];
      
      const initialYear = validYears.includes(currentCalendarYear) 
        ? currentCalendarYear 
        : validYears[validYears.length - 1];
        
      set({ 
        availableYears: validYears,
        referenceYear: initialYear
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
    fetchedYears: []
  })
}));


// ============================================================================
// 2. O HOOK CONECTOR (Mantém a compatibilidade com a HomePage)
// ============================================================================
export function useDashboardData() {
  const { currentUser } = useAuth();
  const store = useDashboardStore();

  // Dispara a busca inicial quando o componente monta
  useEffect(() => {
    if (currentUser) {
      store.processInitialData(currentUser);
    }
  }, [currentUser]); // Rodará sempre que o usuário logar/mudar

  // Cálculos derivados que o componente precisa
  const sortedYearsDesc = [...store.availableYears].sort((a, b) => b - a);
  const visibleDesktopYears = sortedYearsDesc.slice(0, store.desktopVisibleCount);
  const visibleYearsString = visibleDesktopYears.join(',');

  // Carrega os dados visíveis no desktop
  useEffect(() => {
    if (currentUser) {
      visibleDesktopYears.forEach(year => store.fetchMediaForYear(year, currentUser.uid));
    }
  }, [visibleYearsString, currentUser]);

  return {
    isLoading: store.isLoading,
    availableYears: store.availableYears,
    referenceYear: store.referenceYear,
    setReferenceYear: store.setReferenceYear,
    desktopVisibleCount: store.desktopVisibleCount,
    setDesktopVisibleCount: store.setDesktopVisibleCount,
    yearMovies: store.yearMovies,
    yearSeries: store.yearSeries,
    sortedYearsDesc,
    visibleDesktopYears,
    // Fazemos um bind para a HomePage não precisar saber o UID do usuário
    fetchMediaForYear: (year: number) => store.fetchMediaForYear(year, currentUser?.uid || '')
  };
}