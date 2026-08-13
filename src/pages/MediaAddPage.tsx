import React, { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Tag, Clock, PlaySquare, Star } from 'lucide-react';

import { useAuth } from '@/contexts/authContext';
import { getFullImageURL } from '@/utils/imageUtils';
import { addMovie, addSeries } from '@/services/firebase/databaseService';
import { useMediaDetails } from '@/hooks/useMediaDetails';

import DatePicker from '@/components/DatePicker';
import { Button } from '@/components/ui/Button';
import { SeasonCarousel } from '@/components/media/SeasonCarousel';

import type { TMDBMovie } from '@/types/tmdbMovie';
import type { TMDBSeries } from '@/types/tmdbSeries';

// ============================================================================
// SUB-COMPONENTES DE UI
// ============================================================================
const InfoItem = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-start gap-3 mb-3 text-app-text-muted">
    <Icon size={20} className="shrink-0 text-app-primary" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function MediaAddPage() {
  const { currentUser } = useAuth();
  const { mediaType, year: urlYear, id } = useParams();
  const navigate = useNavigate();

  const targetYear = Number(urlYear) || new Date().getFullYear();
  const isMovie = mediaType === 'movies';

  // Extração inteligente da lógica via Hook
  const { richMedia, isLoadingDetails, selectedSeasonId, setSelectedSeasonId } = useMediaDetails(id, isMovie);

  const [isSaving, setIsSaving] = useState(false);
  const [watchedDate, setWatchedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [userRating, setUserRating] = useState<number>(0);

  if (!currentUser) return <Navigate to="/login" replace />;

  if (isLoadingDetails || !richMedia) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app-bg">
        <div className="w-10 h-10 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Usando a segurança dos seus tipos (Type Casting seguro, pois sabemos o tipo via URL)
  const movieData = isMovie ? (richMedia as TMDBMovie) : null;
  const seriesData = !isMovie ? (richMedia as TMDBSeries) : null;

  // Extração limpa graças aos conversores do seu app
  const title = isMovie ? movieData!.title : seriesData!.name;
  const originalTitle = isMovie ? movieData!.originalTitle : seriesData!.originalName;
  const releaseDate = isMovie ? movieData!.releaseDate : seriesData!.firstAirDate; 
  
  const backdropMobile = richMedia.backdropPath ? getFullImageURL(richMedia.backdropPath, 'w500') : null;
  const backdropDesktop = richMedia.backdropPath ? getFullImageURL(richMedia.backdropPath, 'w1280') : null;

  // ==========================================================================
  // SALVAR NO BANCO DE DADOS
  // ==========================================================================
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // O payload base fica livre de verificações complexas de tipo
      const basePayload = {
        id: String(richMedia.id),
        tmdbId: richMedia.id,
        status: richMedia.status || 'Assistido',
        backdropPath: richMedia.backdropPath,
        posterPath: richMedia.posterPath,
        genres: richMedia.genres, // Já é um array de strings
        overview: richMedia.overview,
        watchedDate: new Date(watchedDate + 'T12:00:00'),
        watchedYear: targetYear,
        userRating: userRating,
      };

      if (isMovie && movieData) {
        await addMovie(currentUser.uid, {
          ...basePayload,
          title: movieData.title,
          originalTitle: movieData.originalTitle,
          releaseDate: movieData.releaseDate,
          runtime: movieData.runtime,
        });
      } else if (seriesData) {
        const currentSelectedSeason = seriesData.seasons.find(s => s.id === selectedSeasonId);
        
        await addSeries(currentUser.uid, {
          ...basePayload,
          name: seriesData.name,
          originalName: seriesData.originalName,
          firstAirDate: seriesData.firstAirDate,
          totalSeasons: seriesData.totalSeasons,
          seasonTmdbId: currentSelectedSeason?.id || seriesData.id,
          seasonNumber: currentSelectedSeason?.seasonNumber || 1,
          seasonName: currentSelectedSeason?.name || '1ª Temporada',
          seasonPosterPath: currentSelectedSeason?.posterPath || seriesData.posterPath,
          seasonAirDate: currentSelectedSeason?.airDate || seriesData.firstAirDate,
          seasonOverview: currentSelectedSeason?.overview || '',
        });
      }

      // Retorna para a tela de listagem limpando o cache
      navigate(`/list/${mediaType}/${targetYear}`, { replace: true });
    } catch (error) {
      console.error("Erro ao inserir registro:", error);
      alert("Falha ao salvar a nova entrada.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-app-bg text-app-text flex flex-col relative">
      
      {/* CABEÇALHO */}
      <header className="bg-app-secondary sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-app-text-muted hover:text-app-text transition-colors cursor-pointer">
            <ChevronLeft size={24} />
          </button>
          
          <h1 className="text-base font-bold truncate px-4 flex-1 text-center">
            {title}
          </h1>
          
          <div className="w-10"></div>        
        </div>
      </header>

      <main className="flex-1 w-full pb-12">
        
        {/* BACKDROP HERO IMAGE */}
        <div 
          className="w-full aspect-video md:aspect-21/9 bg-app-input relative shadow-sm"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 70%)',
            maskImage: 'linear-gradient(to top, transparent 0%, black 70%)'
          }}
        >
          {richMedia.backdropPath ? (
            <img 
              src={backdropDesktop || undefined} 
              srcSet={`${backdropMobile} 500w, ${backdropDesktop} 1280w`}
              sizes="100vw" 
              alt={title} 
              loading="lazy"
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <PlaySquare size={48} />
            </div>
          )}
        </div>
        
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 -mt-12 md:-mt-20 relative z-10">        
          
          <h2 className="text-center text-sm font-semibold text-app-text-muted mb-8 drop-shadow-md">
            {originalTitle}
          </h2>

          {/* CARD DE INFORMAÇÕES METADADOS */}
          <div className="bg-app-secondary rounded-2xl p-6 mb-4">
            {releaseDate && <InfoItem icon={Calendar} text={releaseDate.toLocaleDateString('pt-BR')} />}
            
            {richMedia.genres.length > 0 && <InfoItem icon={Tag} text={richMedia.genres.join(', ')} />}
            
            {isMovie && movieData?.runtime && (
              <InfoItem icon={Clock} text={`${Math.floor(movieData.runtime / 60)}h ${movieData.runtime % 60}m`} />
            )}
            
            {!isMovie && seriesData?.totalSeasons && (
              <InfoItem icon={PlaySquare} text={`${seriesData.totalSeasons} temporadas disponíveis.`} />
            )}
            
            {richMedia.overview && (
              <p className="text-sm leading-relaxed text-app-text-muted mt-4 pt-4 border-t border-white/5 text-justify">
                {richMedia.overview}
              </p>
            )}
          </div>

          {/* CARROSSEL DE TEMPORADAS (Aparece apenas quando for Série) */}
          {!isMovie && seriesData && (
            <SeasonCarousel 
              seasons={seriesData.seasons} 
              selectedSeasonId={selectedSeasonId}
              onSelectSeason={setSelectedSeasonId}
              fallbackPosterPath={seriesData.posterPath}
            />
          )}

          {/* ÁREA DE EDIÇÃO INTERATIVA (Data e Nota) */}
          <div className="bg-app-secondary rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 md:gap-6">
            
            {/* Lado Esquerdo: Seletor de Data */}
            <div className="w-full flex flex-col md:flex-1">
              <label className="block text-sm font-bold text-app-text mb-3">Assistido em:</label>
              <DatePicker value={watchedDate} onChange={setWatchedDate} />
            </div>

            {/* Lado Direito: Sistema de Avaliação */}
            <div className="w-full flex flex-col md:flex-2">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-app-text">
                  Sua nota: <span className="text-amber-500">{userRating > 0 ? userRating : '?'}</span>
                </label>
                <button onClick={() => setUserRating(0)} className="text-xs font-bold text-app-text-muted hover:text-red-400 transition-colors cursor-pointer">
                  Limpar
                </button>
              </div>
              
              <div className="flex justify-between items-center w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setUserRating(star)}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    <Star 
                      size={24} 
                      className={`${star <= userRating ? 'fill-amber-500 text-amber-500' : 'text-app-text-muted/30'} md:my-2.5`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
          </div>

          {/* BOTÃO SALVAR REUTILIZANDO O DESIGN SYSTEM */}
          <div className="flex justify-center mt-4">
            <div className="w-full md:w-auto md:min-w-75">
              <Button isLoading={isSaving} onClick={handleSave}>
                Adicionar ao Diário
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}