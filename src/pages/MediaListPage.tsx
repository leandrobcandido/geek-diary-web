import { ChevronLeft, Plus } from 'lucide-react';
import { useMediaFilterAndSort } from '@/hooks/useMediaFilterAndSort';
import { MediaToolbar } from '@/components/media/MediaToolbar';
import { MediaGridView } from '@/components/media/MediaGridView';
import { MediaListView } from '@/components/media/MediaListView';
import type { MediaListItem } from '@/types/mediaListItem'; 

interface MediaListPageProps {
  year: number;
  typeTitle: string; 
  items: MediaListItem[];
  onBack: () => void;
  onAddClick: () => void;
  onItemClick: (item: MediaListItem) => void;
}

const formatDate = (date: Date) => {
  if (!date || isNaN(date.getTime())) return '--/--';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
  } catch (e) {
    return '--/--';
  }
};

export default function MediaListPage({ year, typeTitle, items, onBack, onAddClick, onItemClick }: MediaListPageProps) {
  const {
    searchQuery, setSearchQuery,
    sortBy, isDescending, handleSortClick,
    isGridView, setIsGridView,
    processedItems, stats
  } = useMediaFilterAndSort(items);

  return (
    <div className="min-h-dvh bg-app-bg text-app-text flex flex-col transition-colors duration-300">
      
      {/* CABEÇALHO */}
      <header className="bg-app-secondary sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 text-app-text-muted hover:text-app-text transition-colors cursor-pointer">
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold leading-tight">{typeTitle}</h1>
            <span className="text-xs text-app-text-muted font-medium">{year}</span>
          </div>

          <button onClick={onAddClick} className="p-2 -mr-2 text-app-primary hover:bg-app-primary/10 rounded-full transition-colors cursor-pointer">
            <Plus size={24} />
          </button>          
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 flex flex-col">
        
        <MediaToolbar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          isDescending={isDescending}
          handleSortClick={handleSortClick}
          stats={stats}
          isGridView={isGridView}
          setIsGridView={setIsGridView}
        />

        {processedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-12">
            <span className="font-medium text-lg mb-2">Nenhum resultado encontrado.</span>
            <span className="text-sm">Tente ajustar seus filtros ou busca.</span>
          </div>
        ) : isGridView ? (
          <MediaGridView 
            items={processedItems} 
            onItemClick={onItemClick} 
            formatDate={formatDate} 
          />
        ) : (
          <MediaListView 
            items={processedItems} 
            onItemClick={onItemClick} 
            formatDate={formatDate} 
          />
        )}

      </main>
    </div>
  );
}