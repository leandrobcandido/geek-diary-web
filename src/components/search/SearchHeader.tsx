import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchHeaderProps {
  typeTitle: string;
  year: string | undefined;
}

export function SearchHeader({ typeTitle, year }: SearchHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-app-secondary sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-app-text-muted hover:text-app-text transition-colors flex items-center cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex flex-col items-center flex-1">
          <h1 className="text-base font-bold leading-tight">Buscar {typeTitle}</h1>
          <span className="text-xs text-app-text-muted font-medium">{year}</span>
        </div>

        <div className="w-10"></div> {/* Espaçador para alinhar */}
      </div>
    </header>
  );
}