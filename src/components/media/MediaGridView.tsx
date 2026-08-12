import { Calendar, Film } from 'lucide-react';
import { getFullImageURL } from '@/utils/imageUtils';
import type { MediaListItem } from '@/types/mediaListItem'; 

interface MediaGridViewProps {
  items: MediaListItem[];
  onItemClick: (item: MediaListItem) => void;
  formatDate: (date: Date) => string;
}

export function MediaGridView({ items, onItemClick, formatDate }: MediaGridViewProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
      {items.map(item => (
        <div key={item.id} onClick={() => onItemClick(item)} className="flex flex-col gap-0.5 group cursor-pointer">
          <div className="aspect-2/3 bg-app-input rounded-xl overflow-hidden shadow-sm relative border border-transparent group-hover:border-app-primary transition-colors">
            {item.posterPath ? (
              <img src={getFullImageURL(item.posterPath) || undefined} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20"><Film size={24} /></div>
            )}
            <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/10">              
              <span className="text-[10px] font-bold text-white">{item.userRating > 0 ? item.userRating : '?'}</span>              
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-app-text-muted group-hover:text-app-primary transition-colors">
            {item.rawItem?.seasonNumber && (
              <><span className="text-xs font-semibold">{item.rawItem.seasonNumber}ª</span><span className="text-[10px] opacity-50">•</span></>
            )}
            <Calendar size={12} />
            <span className="text-xs font-semibold">{formatDate(item.watchedDate)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}