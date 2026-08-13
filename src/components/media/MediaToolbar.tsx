import { Search, LayoutGrid, List as ListIcon, Calendar, Star, ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01, Film } from 'lucide-react';
import type { SortType } from '@/hooks/useMediaFilterAndSort';
 // Ajuste o caminho se necessário

interface MediaToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  sortBy: SortType;
  isDescending: boolean;
  handleSortClick: (type: SortType) => void;
  stats: { count: number; avg: string };
  isGridView: boolean;
  setIsGridView: (val: boolean) => void;
}

export function MediaToolbar({
  searchQuery, setSearchQuery,
  sortBy, isDescending, handleSortClick,
  stats, isGridView, setIsGridView
}: MediaToolbarProps) {
  
  const sortButtons = [
    { type: 'date' as SortType, icon: <Calendar size={12} />, label: '' },
    { type: 'title' as SortType, icon: null, label: 'A-Z' },
    { type: 'rating' as SortType, icon: <Star size={14} />, label: '' },
  ];

  return (
    <div>
      <div className="max-w-5xl w-full mx-auto pb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
          <input 
            type="text" 
            placeholder="Buscar título..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-app-input pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:outline-none focus:border-app-primary transition-all text-base"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between bg-app-secondary rounded-xl p-2 mb-6 shadow-sm gap-y-2">
        <div className="flex items-center gap-1">
          {sortButtons.map((btn) => (
            <button 
              key={btn.type}
              onClick={() => handleSortClick(btn.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                sortBy === btn.type ? 'bg-app-primary text-white' : 'text-app-text-muted hover:bg-app-input'
              }`}
            >
              {btn.icon} {btn.label}
              {sortBy === btn.type && (
                isDescending ? (btn.type === 'title' ? <ArrowDownAZ size={14}/> : <ArrowDown01 size={14}/>) 
                             : (btn.type === 'title' ? <ArrowUpAZ size={14}/> : <ArrowUp01 size={14}/>)
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-2 ml-auto">
          <div className="flex items-center gap-1.5 text-app-text-muted">
            <Film size={14} />
            <span className="text-sm font-bold">{stats.count}</span>
          </div>
          <div className="flex items-center gap-1.5 text-app-text-muted">
            <Star size={14} className={stats.avg !== '?' ? "text-amber-500" : ""} />
            <span className="text-sm font-bold">{stats.avg}</span>
          </div>
          <div className="w-px h-5 bg-app-input mx-1"></div>
          <button 
            onClick={() => setIsGridView(!isGridView)}
            className="p-1.5 text-app-text-muted hover:text-app-text hover:bg-app-input rounded-lg transition-colors cursor-pointer"
          >
            {isGridView ? <ListIcon size={20} /> : <LayoutGrid size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}