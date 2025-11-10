import { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Star, Zap, Clock, Tag as TagIcon } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useFavorites } from '@/hooks/useFavorites';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { TemplateResponse, SessionCategory } from '@repo/shared-types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateResponse) => void;
}

// Comment 4: All categories for filtering
const CATEGORIES: SessionCategory[] = ['school', 'programming', 'language', 'personal', 'other'];

export function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  const { templates, loading, searchTemplates } = useTemplates();
  const { isFavorite, toggleFavorite } = useFavorites('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateResponse[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateResponse | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SessionCategory | 'all'>('all');

  // Comment 4: Filter by search and category
  useEffect(() => {
    let results = templates;

    // Apply category filter
    if (categoryFilter !== 'all') {
      results = results.filter((t) => t.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(results);
  }, [searchQuery, categoryFilter, templates]);

  // Comment 4: Select template and close
  const handleSelectTemplate = (template: TemplateResponse) => {
    onSelectTemplate(template);
    onClose();
  };

  // Comment 4: Quick apply without showing full preview
  const handleQuickApply = (e: React.MouseEvent, template: TemplateResponse) => {
    e.stopPropagation();
    handleSelectTemplate(template);
  };

  // Comment 4: Toggle favorite without selecting
  const handleToggleFavorite = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    toggleFavorite(templateId);
  };

  // Comment 4: Group templates by category for display
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<SessionCategory, TemplateResponse[]>);

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

  // Comment 4: Decide whether to show grouped or flat list
  const showGrouped = !searchQuery.trim() && categoryFilter === 'all';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Load Template" size="xl">
      <div className="flex flex-col lg:flex-row gap-4 max-h-[600px]">
        {/* Left Side: Search, Categories, and Template List */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates by name, title, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Comment 4: Category Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors capitalize ${
                  categoryFilter === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Comment 4: Templates List with grouping */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No templates found</p>
                <p className="text-sm">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try different filters'
                    : 'Create a template from a session to get started'}
                </p>
              </div>
            ) : showGrouped ? (
              // Comment 4: Grouped by category
              <div className="space-y-6">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template)}
                          className={`w-full text-left p-3 border rounded-lg transition-all ${
                            selectedTemplate?.id === template.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                {template.name}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{template.title}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {/* Comment 4: Star toggle */}
                              <button
                                onClick={(e) => handleToggleFavorite(e, template.id)}
                                className={`p-1 rounded transition-colors ${
                                  isFavorite(template.id)
                                    ? 'text-yellow-500 hover:text-yellow-600'
                                    : 'text-gray-400 hover:text-yellow-500'
                                }`}
                                aria-label={isFavorite(template.id) ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <Star className={`h-4 w-4 ${isFavorite(template.id) ? 'fill-current' : ''}`} />
                              </button>
                              {/* Comment 4: Quick apply button */}
                              <button
                                onClick={(e) => handleQuickApply(e, template)}
                                className="p-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 rounded transition-colors"
                                aria-label="Quick apply"
                                title="Quick apply template"
                              >
                                <Zap className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Comment 4: Flat list when searching or filtering
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left p-3 border rounded-lg transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{template.title}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => handleToggleFavorite(e, template.id)}
                          className={`p-1 rounded transition-colors ${
                            isFavorite(template.id)
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          aria-label={isFavorite(template.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star className={`h-4 w-4 ${isFavorite(template.id) ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleQuickApply(e, template)}
                          className="p-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 rounded transition-colors"
                          aria-label="Quick apply"
                          title="Quick apply template"
                        >
                          <Zap className="h-4 w-4" />
                        </button>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}
                        >
                          {template.category}
                        </span>
                      </div>
                    </div>
                    {template.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{template.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment 4: Right Side - Preview Panel */}
        {selectedTemplate && (
          <div className="lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{selectedTemplate.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedTemplate.title}</p>

            {selectedTemplate.description && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTemplate.description}</p>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{selectedTemplate.duration} minutes</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                  {selectedTemplate.priority}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Category:</span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(
                    selectedTemplate.category
                  )}`}
                >
                  {selectedTemplate.category}
                </span>
              </div>

              {selectedTemplate.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TagIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Notes
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {selectedTemplate.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 space-y-2">
              <Button onClick={() => handleSelectTemplate(selectedTemplate)} variant="primary" fullWidth>
                Use Template
              </Button>
              <Button onClick={() => setSelectedTemplate(null)} variant="secondary" fullWidth>
                Back to List
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comment 4: Footer */}
      {!selectedTemplate && (
        <div className="mt-4">
          <Button onClick={onClose} variant="secondary" fullWidth>
            Cancel
          </Button>
        </div>
      )}
    </Modal>
  );
}
