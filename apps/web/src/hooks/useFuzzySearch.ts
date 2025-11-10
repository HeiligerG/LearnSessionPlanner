import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';

const MAX_RESULTS = 50;
const SEARCH_DEBOUNCE_MS = 200;

/**
 * Custom hook for fuzzy search using Fuse.js
 * Includes debouncing and optimized Fuse instance creation
 */
export function useFuzzySearch<T>(
  items: T[],
  query: string,
  options: Fuse.IFuseOptions<T>
) {
  const [results, setResults] = useState<Fuse.FuseResult<T>[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Create Fuse instance only when items or options change (2025 best practice)
  const fuse = useMemo(() => {
    const defaultOptions: Fuse.IFuseOptions<T> = {
      includeScore: true,
      includeMatches: true,
      threshold: 0.3,
      ignoreLocation: true,
      ...options,
    };
    return new Fuse(items, defaultOptions);
  }, [items, options]);

  // Perform search with debouncing
  useEffect(() => {
    // If query is empty, return all items
    if (!query.trim()) {
      const allResults: Fuse.FuseResult<T>[] = items.slice(0, MAX_RESULTS).map((item, index) => ({
        item,
        refIndex: index,
        score: 0,
      }));
      setResults(allResults);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounce search
    const timeoutId = setTimeout(() => {
      const searchResults = fuse.search(query, { limit: MAX_RESULTS });
      setResults(searchResults);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [query, fuse, items]);

  return { results, isSearching };
}
