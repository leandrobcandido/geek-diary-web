import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2, Calendar, Tag, Clock, PlaySquare, Star } from 'lucide-react';

import { useAuth } from '@/contexts/authContext';
import { getFullImageURL } from '@/utils/imageUtils';
import { 
  updateMovie, 
  updateSeries, 
  deleteMovie, 
  deleteSeries,
  getMoviesByYear,
  getSeriesByYear
} from '@/services/firebase/databaseService';

import DatePicker from '@/components/DatePicker';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/media/DeleteConfirmModal';

// ============================================================================
// TIPAGENS E FUNÇÕES PURAS
// ============================================================================
interface LocationState {
  rawItem: any; 
  typeTitle: string;
  year: number;
}

const parseSafeDate = (raw: any): Date | null => {
  if (!raw) return null;
  if (typeof raw.toDate === 'function') return raw.toDate();
  if (typeof raw.seconds === 'number') return new Date(raw.seconds * 1000);
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const formatRuntime = (minutes: number) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const InfoItem = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
  <div className="flex items-start gap-3 mb-3 text-app-text-muted">
    <Icon size={20} className="shrink-0 mt-0.5 text-app-primary" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function MediaDetailPage() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { mediaType, year: urlYear, id } = useParams();

  const state = location.state as LocationState | null;

  // Estados principais
  const [media, setMedia] = useState<any>(state?.rawItem || null);
  const [isLoading, setIsLoading] = useState(!media);
  
  // Estados do formulário
  const [watchedDate, setWatchedDate] = useState<string>('');
  const [userRating, setUserRating] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Derivações seguras (usa a URL ou o State)
  const year = Number(urlYear) || state?.year || new Date().getFullYear();
  const isMovie = mediaType === 'movies' || state?.typeTitle?.toLowerCase() === 'filmes';
  const typeTitle = isMovie ? 'Filmes' : 'Séries';

  // 1. EFEITO DE BUSCA (Fallback caso não venha pelo state)
  useEffect(() => {
    async function fetchMedia() {
      // Se já temos a mídia (veio do state) ou faltam dados na URL, não faz nada
      if (media || !currentUser || !id) return;

      try {
        // Graças ao cache offline do Firebase, essa busca é 100% local e instantânea
        const list = isMovie 
          ? await getMoviesByYear(currentUser.uid, year)
          : await getSeriesByYear(currentUser.uid, year);

        const foundItem = list.find((item: any) => String(item.id) === String(id));

        if (foundItem) {
          setMedia(foundItem);
        } else {
          console.warn("Mídia não encontrada no banco.");
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes da mídia:", error);
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    }

    fetchMedia();
  }, [currentUser, id, isMovie, media, navigate, year]);

  // 2. EFEITO DE POPULAÇÃO DO FORMULÁRIO (Roda assim que a mídia estiver pronta)
  useEffect(() => {
    if (media) {
      const rawDate = media.watchedDate;
      let dateObj = new Date();
      
      if (rawDate) {
        if (typeof rawDate.toDate === 'function') dateObj = rawDate.toDate();
        else if (typeof rawDate.seconds === 'number') dateObj = new Date(rawDate.seconds * 1000);
        else dateObj = new Date(rawDate);
      }
      
      const isoDate = isNaN(dateObj.getTime()) 
        ? new Date().toISOString().split('T')[0] 
        : dateObj.toISOString().split('T')[0];
      
      setWatchedDate(isoDate);
      setUserRating(media.userRating || 0);
    }
  }, [media]);

  // Bloqueio de tela cheia enquanto busca os dados
  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app-bg">
        <div className="w-10 h-10 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se a busca falhou ou o usuário não está logado
  if (!media || !currentUser) {
    return <Navigate to="/" replace />;
  }

  // Extração de dados para renderização visual
  const title = isMovie ? (media.title || 'Sem título') : (media.name || 'Sem título');
  const originalTitle = isMovie ? media.originalTitle : media.originalName;
  const safeReleaseDate = parseSafeDate(isMovie ? media.releaseDate : media.seasonAirDate);
  const safeSeasonAirDate = parseSafeDate(media.seasonAirDate); 
  
  const backdropMobile = media.backdropPath ? getFullImageURL(media.backdropPath, 'w500') : null;
  const backdropDesktop = media.backdropPath ? getFullImageURL(media.backdropPath, 'w1280') : null;
  const seasonPosterUrl = media.seasonPosterPath ? getFullImageURL(media.seasonPosterPath, 'w342') : null;

  // ==========================================================================
  // AÇÕES
  // ==========================================================================
  const handleUpdate = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const updatedMedia = {
        ...media,
        watchedDate: new Date(watchedDate + 'T12:00:00'),
        userRating: userRating
      };

      if (isMovie) {
        await updateMovie(currentUser.uid, updatedMedia, year);
      } else {
        await updateSeries(currentUser.uid, updatedMedia, year);
      }
      
      // 🔥 Força o Zustand a atualizar o ano e puxar os novos sumários
      const store = await import('@/hooks/useDashboardData').then(m => m.useDashboardStore.getState());
      await store.forceRefreshYear(updatedMedia.watchedYear, currentUser.uid);
      
      // Se trocou de ano durante a edição, invalida o ano antigo também!
      if (updatedMedia.watchedYear !== year) {
        await store.forceRefreshYear(year, currentUser.uid);
      }

      // Retorna para a tela de listagem
      navigate(`/list/${mediaType}/${updatedMedia.watchedYear}`, { replace: true });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Ocorreu um erro ao salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    setIsSaving(true);
    try {
      if (isMovie) {
        await deleteMovie(currentUser.uid, media);
      } else {
        await deleteSeries(currentUser.uid, media);
      }

      // 🔥 Força o Zustand a remover o filme do cache e atualizar os sumários
      const store = await import('@/hooks/useDashboardData').then(m => m.useDashboardStore.getState());
      await store.forceRefreshYear(year, currentUser.uid);

      // Retorna para a HomePage, pois a lista de origem pode ter ficado vazia
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Ocorreu um erro ao excluir.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-app-bg text-app-text flex flex-col relative">
      
      <header className="bg-app-secondary sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-app-text-muted hover:text-app-text transition-colors cursor-pointer">
            <ChevronLeft size={24} />
          </button>
          
          <h1 className="text-base font-bold truncate px-4 flex-1 text-center">
            {title}
          </h1>
          
          <button onClick={() => setShowDeleteModal(true)} className="p-2 -mr-2 text-red-500 hover:text-red-400 transition-colors cursor-pointer">
            <Trash2 size={22} />
          </button>        
        </div>
      </header>

      <main className="flex-1 w-full pb-12">
        
        {/* BACKDROP HERO IMAGE */}
        <div 
          className="w-full aspect-video md:aspect-21/9 bg-app-input relative"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 70%)',
            maskImage: 'linear-gradient(to top, transparent 0%, black 70%)'
          }}
        >
          {media.backdropPath ? (
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

          <div className="bg-app-secondary rounded-2xl p-6 mb-4">
            {safeReleaseDate && <InfoItem icon={Calendar} text={safeReleaseDate.toLocaleDateString('pt-BR')} />}
            {media.genres?.length > 0 && <InfoItem icon={Tag} text={media.genres.join(', ')} />}
            {isMovie && media.runtime && <InfoItem icon={Clock} text={formatRuntime(media.runtime)} />}
            {!isMovie && media.totalSeasons && <InfoItem icon={PlaySquare} text={`${media.totalSeasons} temp.`} />}
            {media.overview && <p className="text-sm leading-relaxed text-app-text-muted mt-4 pt-4 border-t border-white/5">{media.overview}</p>}
          </div>

          {!isMovie && media.seasonNumber && (
            <div className="bg-app-secondary rounded-2xl p-4 flex gap-4 mb-4 h-36 sm:h-44 items-stretch">
              <div className="h-full aspect-2/3 bg-app-input rounded-lg overflow-hidden shrink-0 shadow-inner">
                {seasonPosterUrl ? (
                  <img src={seasonPosterUrl} alt="Season" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <PlaySquare size={24} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden py-1">
                <h3 className="font-bold text-base sm:text-lg leading-tight mb-1 truncate shrink-0">
                  {media.seasonName || `${media.seasonNumber}ª Temporada`}
                </h3>
                
                {safeSeasonAirDate && (
                  <span className="text-xs font-semibold text-app-text-muted shrink-0 mb-2">
                    Lançamento: {safeSeasonAirDate.getFullYear()}
                  </span>
                )}
                
                <div className="flex-1 overflow-y-auto pr-2 text-xs sm:text-sm leading-relaxed text-app-text-muted text-justify [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                  {media.seasonOverview ? media.seasonOverview : <span className="italic opacity-50">Sem sinopse disponível para esta temporada.</span>}
                </div>
              </div>
            </div>
          )}

          <div className="bg-app-secondary rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="w-full flex flex-col md:flex-1">
              <label className="block text-sm font-bold text-app-text mb-3">Assistido em:</label>
              <DatePicker value={watchedDate} onChange={setWatchedDate} />
            </div>

            <div className="w-full flex flex-col md:flex-2">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-app-text">
                  Sua nota: <span className="text-amber-500">{userRating > 0 ? userRating : '?'}</span>
                </label>
                <button 
                  onClick={() => setUserRating(0)} 
                  className="text-xs font-bold text-app-text-muted hover:text-red-400 transition-colors cursor-pointer"
                >
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

          <div className="flex justify-center mt-4">
             <div className="w-full md:w-auto md:min-w-75">
                <Button isLoading={isSaving} onClick={handleUpdate}>
                  Salvar Alterações
                </Button>
             </div>
          </div>
        </div>
      </main>

      <DeleteConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        isDeleting={isSaving}
        itemName={typeTitle.slice(0, -1)} 
      />

    </div>
  );
}