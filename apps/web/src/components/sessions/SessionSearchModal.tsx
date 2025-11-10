import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Calendar, Clock, Tag, Star, History } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import type { SessionResponse, SessionCategory } from '@repo/shared-types';
import { api } from '@/services/api';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { useRecentSessions } from '@/hooks/useRecentSessions';
import { useFavorites } from '@/hooks/useFavorites';

interface SessionSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: SessionResponse) => void;
}

// Comment 3: Type for section tabs
type SearchSection = 'search' | 'recent' | 'favorites';

export function SessionSearchModal({ isOpen, onClose, onSelectSession }: SessionSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allSessions, setAllSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<SearchSection>('search');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const resultsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Comment 3: Use fuzzy search with configured keys and weights
  const fuzzyResults = useFuzzySearch(allSessions, searchQuery, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'description', weight: 1 },
      { name: 'tags', weight: 1.5 },
    ],
    threshold: 0.4,
  });

  // Comment 3: Use recent sessions and favorites
  const { recentSessions, addRecentSession } = useRecentSessions();
  const { isFavoriteSession, toggleFavoriteSession } = useFavorites();

  // Comment 3: Load all sessions on mount for fuzzy search
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setActiveSection('search');
      setFocusedIndex(0);
      return;
    }

    const loadSessions = async () => {
      setLoading(true);
      try {
        const response = await api.sessions.getAll();
        // Ensure we always set an array, even if response.data is null/undefined
        const sessions = response?.data;
        if (Array.isArray(sessions)) {
          setAllSessions(sessions);
        } else {
          console.warn('API response is not an array:', sessions);
          setAllSessions([]);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
        setAllSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [isOpen]);

  // Comment 3: Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(0);
  }, [searchQuery, activeSection]);

  // Comment 3: Focus result item when index changes
  useEffect(() => {
    resultsRef.current[focusedIndex]?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [focusedIndex]);

  // Comment 3: Add to recent sessions before selecting
  const handleSelectSession = (session: SessionResponse) => {
    addRecentSession(session);
    onSelectSession(session);
    onClose();
  };

  // Comment 3: Toggle favorite without closing modal
  const handleToggleFavorite = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    toggleFavoriteSession(sessionId);
  };

  // Comment 3: Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentResults = getCurrentResults();
      if (currentResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % currentResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + currentResults.length) % currentResults.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (currentResults[focusedIndex]) {
            handleSelectSession(currentResults[focusedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, activeSection, searchQuery]);

  // Comment 3: Get current results based on active section
  const getCurrentResults = (): SessionResponse[] => {
    if (activeSection === 'recent') {
      return recentSessions;
    }
    if (activeSection === 'favorites') {
      return allSessions.filter((session) => isFavoriteSession(session.id));
    }
    // Search section
    if (searchQuery.trim()) {
      return fuzzyResults.results.map(result => result.item);
    }
    return [];
  };

  // Comment 3: Highlight matched text
  const highlightMatches = (text: string, indices?: readonly [number, number][]): React.ReactNode => {
    if (!indices || indices.length === 0) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    indices.forEach(([start, end]) => {
      // Add text before match
      if (start > lastIndex) {
        parts.push(text.substring(lastIndex, start));
      }
      // Add highlighted match
      parts.push(
        <mark key={start} className="highlight">
          {text.substring(start, end + 1)}
        </mark>
      );
      lastIndex = end + 1;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  const getCategoryColor = (category: SessionCategory) => {
    const colors: Record<SessionCategory, string> = {
      school: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      programming: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      language: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      personal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return colors[category] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || colors.planned;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const currentResults = getCurrentResults();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Sessions" size="lg" showCloseButton={false}>
      {/* Comment 3: Section Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSection('search')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeSection === 'search'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Search className="h-4 w-4" />
          Search
        </button>
        <button
          onClick={() => setActiveSection('recent')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeSection === 'recent'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <History className="h-4 w-4" />
          Recent
          {recentSessions.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">
              {recentSessions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('favorites')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeSection === 'favorites'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Star className="h-4 w-4" />
          Favorites
        </button>
      </div>

      {/* Search Bar - only visible in search section */}
      {activeSection === 'search' && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comment 3: Results with highlighting and favorites */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : currentResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            {activeSection === 'search' && !searchQuery ? (
              <>
                <Search className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Fuzzy Search</p>
                <p className="text-sm">Type to search across title, description, and tags</p>
              </>
            ) : activeSection === 'search' && searchQuery ? (
              <>
                <Search className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No sessions found</p>
                <p className="text-sm">Try different search terms</p>
              </>
            ) : activeSection === 'recent' ? (
              <>
                <History className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No recent sessions</p>
                <p className="text-sm">Sessions you edit will appear here</p>
              </>
            ) : (
              <>
                <Star className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No favorites</p>
                <p className="text-sm">Star sessions to add them to favorites</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {currentResults.map((session, index) => (
              <button
                key={session.id}
                ref={(el) => (resultsRef.current[index] = el)}
                onClick={() => handleSelectSession(session)}
                className={`w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all ${
                  index === focusedIndex ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
                    {session.title}
                  </h3>
                  <div className="flex gap-2 ml-2">
                    {/* Comment 3: Star button for favorites */}
                    <button
                      onClick={(e) => handleToggleFavorite(e, session.id)}
                      className={`p-1 rounded transition-colors ${
                        isFavoriteSession(session.id)
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                      aria-label={isFavoriteSession(session.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`h-4 w-4 ${isFavoriteSession(session.id) ? 'fill-current' : ''}`} />
                    </button>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(session.category)}`}>
                      {session.category}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                      {session.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {session.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {session.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {session.scheduledFor && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(session.scheduledFor)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {session.duration} min
                  </span>
                  {session.tags && session.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {session.tags.slice(0, 2).join(', ')}
                      {session.tags.length > 2 && ` +${session.tags.length - 2}`}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comment 3: Footer with keyboard hints */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {currentResults.length > 0 ? 'Arrow keys to navigate, Enter to select, ' : ''}ESC to close
        </span>
        {currentResults.length > 0 && (
          <span>{currentResults.length} result{currentResults.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </Modal>
  );
}
