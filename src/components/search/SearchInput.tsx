import { Search, X } from 'lucide-react';
import React from 'react';

interface SearchInputProps {
  query: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder: string;
  inputRef: React.Ref<HTMLInputElement>;
}

export function SearchInput({ query, onChange, onClear, placeholder, inputRef }: SearchInputProps) {
  return (
    <div className="max-w-5xl w-full mx-auto pb-4">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
        <input 
          ref={inputRef}
          type="text" 
          autoFocus
          placeholder={placeholder}
          value={query}
          onChange={onChange}
          className="w-full bg-app-input pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:outline-none focus:border-app-primary focus:ring-1 focus:ring-app-primary transition-all text-base"
        />
        {query.length > 0 && (
          <button 
            onClick={onClear}
            className="absolute right-3 top-3 text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}