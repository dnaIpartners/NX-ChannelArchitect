
import React, { useState } from 'react';
import { SearchIcon } from './icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, placeholder }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative h-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || "유튜브 채널 이름 또는 ID를 입력하세요..."}
          className="w-full h-full px-5 py-3 pr-16 text-base bg-white dark:bg-slate-700 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center justify-center w-16 h-full text-white bg-blue-600 rounded-r-full hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
          disabled={isLoading}
        >
          <SearchIcon />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;