import { Calendar, Star, Film, Plus } from 'lucide-react';
import { getFullImageURL } from '@/utils/imageUtils';

// 🔥 Definimos a tipagem exata do nosso novo objeto de sumário
export interface MediaSummary {
  count: number;
  avgRating: number;
  lastWatchedDate: any; // Pode ser Timestamp do Firebase ou String ISO
  backdropPath: string | null;
}

interface SummaryCardProps {
  title: string;
  summary?: MediaSummary; // Substituímos o items: MediaItem[] pelo summary
  fallbackImg: string;
  onAddClick: () => void;
  onClick: () => void;
}

export function MediaSummaryCard({ title, summary, fallbackImg, onAddClick, onClick }: SummaryCardProps) {
  // Extração O(1) super rápida!
  const count = summary?.count || 0;
  const hasItems = count > 0;
  
  // Pegamos a imagem em tamanho ideal para o card (w500 é leve e perfeito)
  const backdropUrl = summary?.backdropPath ? getFullImageURL(summary.backdropPath, 'w500') : null;
  
  // Média já calculada pelo nosso syncYearSummary
  const avgRating = (summary?.avgRating && summary.avgRating > 0) ? summary.avgRating : '?';

  const formatLatestDate = (dateData?: any) => {
    if (!dateData) return '--/--/----';
    try {
      // Lida tanto com Timestamp do Firebase quanto com objetos Date ou Strings
      const dateObj = typeof dateData === 'object' && 'toDate' in dateData 
        ? dateData.toDate() 
        : new Date(dateData);
        
      return isNaN(dateObj.getTime()) ? '--/--/----' : new Intl.DateTimeFormat('pt-BR').format(dateObj);
    } catch {
      return '--/--/----';
    }
  };

  const latestDateStr = hasItems ? formatLatestDate(summary?.lastWatchedDate) : '--/--/----';

  return (
    <div onClick={onClick} className="relative aspect-video rounded-2xl overflow-hidden shadow-md group cursor-pointer border border-app-input">
      <img 
        src={backdropUrl || fallbackImg} 
        alt={`Capa de ${title}`}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/20 to-black/90 pointer-events-none"></div>

      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <div className="flex items-start justify-between z-10">
          <h2 className="text-2xl font-bold text-white border-l-4 border-app-primary pl-3 drop-shadow-lg">
            {title}
          </h2>
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              onAddClick();
            }}
            aria-label="Adicionar novo registro"
            title="Adicionar novo"
            className="w-8 h-8 flex items-center justify-center text-white bg-black/40 hover:bg-app-primary rounded-full backdrop-blur-sm transition-colors border border-white/10 cursor-pointer"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="z-10 text-white">
          {hasItems ? (
            <div className="flex flex-col">
              <div className="flex justify-between items-center pt-4">
                <div className="flex items-center gap-1">
                  <Calendar size={12} className="text-white/50"/>
                  <span className="font-bold text-sm">{latestDateStr}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Film size={12} className="text-white/50"/>
                    <span className="font-bold text-sm">{count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-white/50"/>
                    <span className="font-bold text-sm">{avgRating}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-70 mb-4">
              <span className="font-medium text-center drop-shadow-md">Nenhum registro encontrado.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}