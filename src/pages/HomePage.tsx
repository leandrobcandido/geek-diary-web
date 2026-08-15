import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';

import { useDashboardData } from '@/hooks/useDashboardData';
import { logout } from '@/services/firebase/authService';

// ⚠️ ATENÇÃO: Nós vamos precisar ajustar esse componente no próximo passo!
import { MediaSummaryCard } from '@/components/MediaSummaryCard';
import { Button } from '@/components/ui/Button';

import logo from '@/assets/logo.png';
import noMoviesImg from '@/assets/no-movies.png';
import noSeriesImg from '@/assets/no-series.png';

export default function HomePage() {
  const navigate = useNavigate();
  
  const {
    isLoading,
    availableYears,
    referenceYear,
    setReferenceYear,
    setDesktopVisibleCount,
    // 🔥 MÁGICA: Trocamos as listas completas pelos sumários levinhos
    summaryMovies,
    summarySeries,
    sortedYearsDesc,
    visibleDesktopYears,
  } = useDashboardData();

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  
  // Lógica de navegação simplificada (olha apenas para a quantidade)
  const handleCardNavigation = (year: number, type: 'movies' | 'series', count: number) => {
    if (count > 0) {
      navigate(`/list/${type}/${year}`);
    } else {
      navigate(`/search/${type}/${year}`);
    }
  };

  const handlePreviousYear = () => {
    const currentIndex = availableYears.indexOf(referenceYear);
    if (currentIndex > 0) {
      setSlideDirection('left');
      setReferenceYear(availableYears[currentIndex - 1]);
      // fetchMediaForYear removido! Troca de telas agora é instantânea na memória.
    }
  };

  const handleNextYear = () => {
    const currentIndex = availableYears.indexOf(referenceYear);
    if (currentIndex < availableYears.length - 1) {
      setSlideDirection('right');
      setReferenceYear(availableYears[currentIndex + 1]);
    }
  };

  // ==========================================================================
  // LÓGICA DE GESTOS (SWIPE HORIZONTAL)
  // ==========================================================================
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) handleNextYear();
    else if (distance < -minSwipeDistance) handlePreviousYear();
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app-bg">
        <div className="w-10 h-10 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-app-bg text-app-text flex flex-col transition-colors duration-300 overflow-x-hidden">
      
      <header className="bg-app-secondary sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Geek Diary Logo" className="w-12 h-12 object-contain" />
            <h1 className="text-xl font-bold hidden sm:block">Geek Diary</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/settings')} 
              className="text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            >
              <Settings size={22} />
            </button>            
            <button 
              onClick={logout} 
              className="text-red-500 hover:text-red-400 transition-colors ml-2 cursor-pointer"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* ================================================================== */}
        {/* VIEW MOBILE (Carrossel Virtual) */}
        {/* ================================================================== */}
        <div 
          className="md:hidden flex flex-col gap-6"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex flex-col items-center justify-center bg-app-surface py-5 px-6 rounded-2xl mx-auto w-full max-w-xs select-none">
            <span className="text-3xl font-black text-center">{referenceYear}</span>
            
            <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
              {availableYears.map((year) => (
                <div 
                  key={year} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    year === referenceYear ? 'w-6 bg-app-primary' : 'w-1.5 bg-app-text-muted/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <div 
            key={referenceYear} 
            className={`grid grid-cols-1 gap-8 animate-in fade-in duration-300 ${
              slideDirection === 'left' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'
            }`}
          >
            {/* 🔥 Passamos o objeto 'summary' no lugar do array 'items' */}
            <MediaSummaryCard 
              title="Filmes"
              summary={summaryMovies[referenceYear]}
              fallbackImg={noMoviesImg}
              onAddClick={() => navigate(`/search/movies/${referenceYear}`)}
              onClick={() => handleCardNavigation(referenceYear, 'movies', summaryMovies[referenceYear]?.count || 0)}
            />
            
            <MediaSummaryCard 
              title="Séries"
              summary={summarySeries[referenceYear]}
              fallbackImg={noSeriesImg}
              onAddClick={() => navigate(`/search/series/${referenceYear}`)}
              onClick={() => handleCardNavigation(referenceYear, 'series', summarySeries[referenceYear]?.count || 0)}
            />
          </div>
        </div>

        {/* ================================================================== */}
        {/* VIEW DESKTOP */}
        {/* ================================================================== */}
        <div className="hidden md:flex flex-col gap-12">
          {visibleDesktopYears.map((year) => (
            <div key={year} className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <h2 className="text-4xl font-black text-app-text">{year}</h2>
                <div className="h-px bg-app-text-muted/20 flex-1"></div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <MediaSummaryCard 
                  title="Filmes"
                  summary={summaryMovies[year]}
                  fallbackImg={noMoviesImg}
                  onAddClick={() => navigate(`/search/movies/${year}`)}
                  onClick={() => handleCardNavigation(year, 'movies', summaryMovies[year]?.count || 0)}
                />
                
                <MediaSummaryCard 
                  title="Séries"
                  summary={summarySeries[year]}
                  fallbackImg={noSeriesImg}
                  onAddClick={() => navigate(`/search/series/${year}`)}
                  onClick={() => handleCardNavigation(year, 'series', summarySeries[year]?.count || 0)}
                />
              </div>
            </div>
          ))}

          {visibleDesktopYears.length < sortedYearsDesc.length && (
            <div className="flex justify-center mt-4">
              <div className="w-full max-w-sm">
                <Button 
                  variant="ghost" 
                  onClick={() => setDesktopVisibleCount(prev => prev + 3)}
                >
                  Carregar mais anos
                </Button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}