import { ChevronRight } from 'lucide-react';
import { getFullImageURL } from '@/utils/imageUtils';
import React from 'react';

// Tipagem baseada no que você tinha
export interface TMDBResult {
  id: number;
  title?: string | null;
  name?: string | null;
  originalTitle?: string | null;
  originalName?: string | null;
  posterPath?: string | null;
  releaseDate?: Date | string | null; 
  firstAirDate?: Date | string | null;
}

interface SearchResultItemProps {
  item: TMDBResult;
  onClick: (item: TMDBResult) => void;
  emptyIcon: React.ElementType; // Para passar o ícone de fallback dinâmico (Film ou Tv)
}

// Funções de formatação puras extraídas para fora do componente
const getTitle = (item: TMDBResult) => item.title || item.name || 'Sem Título';

const getSubTitle = (item: TMDBResult) => {
  const original = item.originalTitle || item.originalName;
  const date = item.releaseDate || item.firstAirDate;
  
  let yearStr = '';
  if (date) {
    if (typeof date === 'string') {
      yearStr = date.substring(0, 4);
    } else if (typeof (date as Date).getFullYear === 'function') {
      yearStr = (date as Date).getFullYear().toString();
    }
  }
  
  if (original && yearStr) return `${original} • ${yearStr}`;
  if (original) return original;
  if (yearStr) return yearStr;
  return '';
};

export function SearchResultItem({ item, onClick, emptyIcon: EmptyIcon }: SearchResultItemProps) {
  return (
    <button
      onClick={() => onClick(item)}
      className="flex items-center gap-4 p-2 sm:px-6 hover:bg-app-surface border-b border-app-input/50 transition-colors text-left cursor-pointer group w-full"
    >
      <div className="w-14 aspect-2/3 bg-app-input rounded-md overflow-hidden shrink-0 shadow-sm relative">
        {item.posterPath ? (
          <img src={getFullImageURL(item.posterPath, 'w154') || undefined} alt={getTitle(item)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <EmptyIcon size={20} />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base leading-tight truncate group-hover:text-app-primary transition-colors">
          {getTitle(item)}
        </h3>
        <span className="text-sm text-app-text-muted truncate block mt-1">
          {getSubTitle(item)}
        </span>
      </div>

      <ChevronRight size={20} className="text-app-text-muted opacity-50 group-hover:opacity-100 group-hover:text-app-primary transition-all transform group-hover:translate-x-1" />
    </button>
  );
}