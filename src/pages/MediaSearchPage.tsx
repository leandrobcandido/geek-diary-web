import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film, Tv } from 'lucide-react';
import { searchMovies, searchSeries } from '@/services/tmdb/tmdbService';

import { SearchHeader } from '@/components/search/SearchHeader';
import { SearchInput } from '@/components/search/SearchInput';
import { SearchResultItem, type TMDBResult } from '@/components/search/SearchResultItem';

export default function MediaSearchPage() {
  const { mediaType, year } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isMovie = mediaType === 'movies';
  const typeTitle = isMovie ? 'Filmes' : 'Séries';
  const EmptyIcon = isMovie ? Film : Tv;

  // Lógica de Debounce
  useEffect(() => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery === '') {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = isMovie 
          ? await searchMovies(trimmedQuery) 
          : await searchSeries(trimmedQuery);
        setResults(data);
      } catch (error) {
        console.error("Erro na busca:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isMovie]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleItemSelect = (item: TMDBResult) => {
    navigate(`/add/${mediaType}/${year}/${item.id}`, { 
      state: { tmdbItem: item, typeTitle, year } 
    });
  };

  return (
    <div className="min-h-dvh bg-app-bg text-app-text flex flex-col transition-colors duration-300">
      
      <SearchHeader typeTitle={typeTitle} year={year} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 flex flex-col">
        
        <SearchInput 
          query={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={handleClear}
          placeholder={`Digite o nome d${isMovie ? 'o filme' : 'a série'}...`}
          inputRef={inputRef}
        />

        {/* ÁREA DE RESULTADOS */}
        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col pb-6">
              {results.map((item) => (
                <SearchResultItem 
                  key={item.id} 
                  item={item} 
                  onClick={handleItemSelect} 
                  emptyIcon={EmptyIcon} 
                />
              ))}
            </div>
          ) : query.trim().length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-12 px-6">
              <EmptyIcon size={64} className="mb-4 opacity-50" />
              <span className="font-bold text-xl mb-2">Nenhum resultado</span>
              <span className="text-sm max-w-xs">Verifique a ortografia ou tente buscar pelo título original em inglês.</span>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center opacity-20 pb-20">
               <EmptyIcon size={80} />
             </div>
          )}
        </div>
      </main>
    </div>
  );
}