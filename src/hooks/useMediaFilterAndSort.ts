import { useState, useMemo } from 'react';
import type { MediaListItem } from '@/types/mediaListItem';
 // Ajuste o caminho conforme necessário

export type SortType = 'date' | 'title' | 'rating';

export function useMediaFilterAndSort(items: MediaListItem[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [isDescending, setIsDescending] = useState(true);
  const [isGridView, setIsGridView] = useState(true);

  const processedItems = useMemo(() => {
    // CLONE O ARRAY para evitar a mutação do estado original (Bug Crítico resolvido)
    let result = [...items]; 

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.originalTitle && item.originalTitle.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'rating':
          comparison = (a.userRating || 0) - (b.userRating || 0);
          break;
        case 'date':
        default:
          comparison = a.watchedDate.getTime() - b.watchedDate.getTime();
          break;
      }
      return isDescending ? -comparison : comparison;
    });
  }, [items, searchQuery, sortBy, isDescending]);

  const stats = useMemo(() => {
    const count = processedItems.length;
    const ratedItems = processedItems.filter(i => (i.userRating || 0) > 0);
    const avg = ratedItems.length > 0 
      ? (ratedItems.reduce((acc, curr) => acc + (curr.userRating || 0), 0) / ratedItems.length).toFixed(1) 
      : '?';

    return { count, avg };
  }, [processedItems]);

  const handleSortClick = (type: SortType) => {
    if (sortBy === type) {
      setIsDescending(prev => !prev);
    } else {
      setSortBy(type);
      setIsDescending(true);
    }
  };

  return {
    searchQuery, setSearchQuery,
    sortBy, isDescending, handleSortClick,
    isGridView, setIsGridView,
    processedItems, stats
  };
}