import { getFullImageURL } from '@/utils/imageUtils';
import type { TMDBSeason } from '@/types/tmdbSeason';

interface SeasonCarouselProps {
  seasons: TMDBSeason[];
  selectedSeasonId: number | null;
  onSelectSeason: (id: number) => void;
  fallbackPosterPath: string | null;
}

export function SeasonCarousel({ seasons, selectedSeasonId, onSelectSeason, fallbackPosterPath }: SeasonCarouselProps) {
  if (!seasons || seasons.length === 0) return null;

  return (
    <div className="bg-app-secondary rounded-2xl p-4 mb-4">
      <label className="block text-sm font-bold text-app-text mb-3 px-1">
        Qual temporada você assistiu?
      </label>
      
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin snap-x scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        {seasons.map((season) => {
          const isSelected = selectedSeasonId === season.id;
          const seasonPoster = season.posterPath 
            ? getFullImageURL(season.posterPath, 'w185') 
            : fallbackPosterPath 
              ? getFullImageURL(fallbackPosterPath, 'w185') 
              : null;

          return (
            <button
              key={season.id}
              onClick={() => onSelectSeason(season.id)}
              className={`flex flex-col items-center p-2 rounded-2xl shrink-0 w-28 text-center transition-all cursor-pointer snap-start outline-none
                ${isSelected 
                  ? 'bg-app-primary/10 shadow-md scale-105 text-app-primary' 
                  : 'bg-app-secondary hover:border-white/10 text-app-text-muted'
                }`}
            >
              <div className="w-full aspect-2/3 bg-app-input rounded-xl overflow-hidden shadow-inner mb-2 relative">
                {seasonPoster && (
                  <img src={seasonPoster} alt={season.name} loading="lazy" className="w-full h-full object-cover" />
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-app-primary/10 border-2 border-app-primary rounded-xl" />
                )}
              </div>
              <span className="text-xs font-bold truncate w-full px-1">{season.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}