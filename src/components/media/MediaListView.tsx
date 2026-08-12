import { Calendar, Star, Film } from 'lucide-react';
import { getFullImageURL } from '@/utils/imageUtils';
import type { MediaListItem } from '@/types/mediaListItem'; 

interface MediaListViewProps {
  items: MediaListItem[];
  onItemClick: (item: MediaListItem) => void;
  formatDate: (date: Date) => string;
}

export function MediaListView({ items, onItemClick, formatDate }: MediaListViewProps) {
  return (
    <div className="flex flex-col gap-1">
      {items.map(item => (
        <div key={item.id} onClick={() => onItemClick(item)} className="flex items-center gap-4 p-1 rounded-xl border border-transparent hover:border-app-primary transition-colors cursor-pointer group">
          <div className="w-16 sm:w-20 aspect-2/3 bg-app-input rounded-lg overflow-hidden shrink-0">
            {item.posterPath ? (
              <img src={getFullImageURL(item.posterPath) || undefined} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20"><Film size={20} /></div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-bold text-sm sm:text-base leading-tight truncate group-hover:text-app-primary transition-colors">{item.title}</h3>
            {item.originalTitle && item.originalTitle !== item.title && (
              <span className="text-xs text-app-text-muted truncate mt-0.5">{item.originalTitle}</span>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0 border-l border-app-input pl-4">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-500" />
              <span className="font-bold text-sm">{item.userRating > 0 ? item.userRating : '?'}</span>
            </div>
            {item.rawItem?.seasonNumber && (
              <span className="text-xs font-semibold text-app-text-muted">{item.rawItem.seasonNumber}ª Temp.</span>
            )}
            <div className="flex items-center gap-1 text-app-text-muted">
              <Calendar size={12} />
              <span className="text-xs font-semibold">{formatDate(item.watchedDate)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}