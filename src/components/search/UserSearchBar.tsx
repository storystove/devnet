
"use client";

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

interface UserSearchBarProps {
  onSearch: (searchTerm: string) => void;
  isLoading?: boolean;
}

export function UserSearchBar({ onSearch, isLoading = false }: UserSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="search"
        placeholder="Search for users by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-grow"
        aria-label="Search users"
      />
      <Button type="submit" disabled={isLoading || !searchTerm.trim()}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        <span className="ml-2 hidden sm:inline">Search</span>
      </Button>
    </form>
  );
}
