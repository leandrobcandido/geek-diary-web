import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react'; // Setas removidas

import { useDashboardData } from '@/hooks/useDashboardData';
import { logout } from '@/services/firebase/authService';
import { MediaSummaryCard, type MediaItem } from '@/components/MediaSummaryCard';
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
    yearMovies,
    yearSeries,
    sortedYearsDesc,
    visibleDesktopYears,
    fetchMediaForYear
  } = useDashboardData();

  // Estados para capturar o gesto de arrastar (Swipe) Horizontal
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  
  // Estado para controlar a direção da animação do carrossel
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  
  const handleCardNavigation = (year: number, type: 'movies' | 'series', items: MediaItem[]) => {
    if (items.length > 0) {
      navigate(`/list/${type}/${year}`);
    } else {
      navigate(`/search/${type}/${year}`);
    }
  };

  const handlePreviousYear = () => {
    const currentIndex = availableYears.indexOf(referenceYear);
    if (currentIndex > 0) {
      setSlideDirection('left'); // Anima vindo da esquerda
      const prevYear = availableYears[currentIndex - 1];
      setReferenceYear(prevYear);
      fetchMediaForYear(prevYear);
    }
  };

  const handleNextYear = () => {
    const currentIndex = availableYears.indexOf(referenceYear);
    if (currentIndex < availableYears.length - 1) {
      setSlideDirection('right'); // Anima vindo da direita
      const nextYear = availableYears[currentIndex + 1];
      setReferenceYear(nextYear);
      fetchMediaForYear(nextYear);
    }
  };

  // ==========================================================================
  // LÓGICA DE GESTOS (SWIPE HORIZONTAL)
  // ==========================================================================
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null); // Reseta o final do toque
    setTouchStartX(e.targetTouches[0].clientX); // Captura o X inicial (Horizontal)
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX); // Vai atualizando o X enquanto arrasta
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // Mínimo de 50px para considerar que foi um arrasto intencional

    // Arrasto para a ESQUERDA (<--) Puxa o próximo item (Ano mais antigo)
    if (distance > minSwipeDistance) {
      handleNextYear();
    } 
    // Arrasto para a DIREITA (-->) Puxa o item anterior (Ano mais recente)
    else if (distance < -minSwipeDistance) {
      handlePreviousYear();
    }
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
          {/* Card do Ano e Indicadores do Carrossel */}
          <div className="flex flex-col items-center justify-center bg-app-surface py-5 px-6 rounded-2xl mx-auto w-full max-w-xs select-none">
            <span className="text-3xl font-black text-center">{referenceYear}</span>
            
            {/* Dots (Pontinhos) do Carrossel */}
            <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
              {availableYears.map((year) => (
                <div 
                  key={year} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    year === referenceYear 
                      ? 'w-6 bg-app-primary' 
                      : 'w-1.5 bg-app-text-muted/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Cards com Animação de Deslizamento (Slide) baseada na chave do Ano */}
          <div 
            key={referenceYear} // <-- A mágica da animação no React acontece ao trocar essa key
            className={`grid grid-cols-1 gap-8 animate-in fade-in duration-300 ${
              slideDirection === 'left' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'
            }`}
          >
            <MediaSummaryCard 
              title="Filmes"
              items={yearMovies[referenceYear] || []}
              fallbackImg={noMoviesImg}
              onAddClick={() => navigate(`/search/movies/${referenceYear}`)}
              onClick={() => handleCardNavigation(referenceYear, 'movies', yearMovies[referenceYear] || [])}
            />
            
            <MediaSummaryCard 
              title="Séries"
              items={yearSeries[referenceYear] || []}
              fallbackImg={noSeriesImg}
              onAddClick={() => navigate(`/search/series/${referenceYear}`)}
              onClick={() => handleCardNavigation(referenceYear, 'series', yearSeries[referenceYear] || [])}
            />
          </div>
        </div>

        {/* ================================================================== */}
        {/* VIEW DESKTOP (Inalterada) */}
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
                  items={yearMovies[year] || []}
                  fallbackImg={noMoviesImg}
                  onAddClick={() => navigate(`/search/movies/${year}`)}
                  onClick={() => handleCardNavigation(year, 'movies', yearMovies[year] || [])}
                />
                
                <MediaSummaryCard 
                  title="Séries"
                  items={yearSeries[year] || []}
                  fallbackImg={noSeriesImg}
                  onAddClick={() => navigate(`/search/series/${year}`)}
                  onClick={() => handleCardNavigation(year, 'series', yearSeries[year] || [])}
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