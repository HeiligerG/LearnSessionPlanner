import { useState, useEffect } from 'react';
import { X, Search, Loader2, FileText } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import type { TemplateResponse, SessionCategory } from '@repo/shared-types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateResponse) => void;
}

export function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  const { templates, loading, searchTemplates } = useTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateResponse[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(async () => {
        const results = await searchTemplates(searchQuery);
        setFilteredTemplates(results);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setFilteredTemplates(templates);
    }
  }, [searchQuery, templates, searchTemplates]);

  const handleSelectTemplate = (template: TemplateResponse) => {
    onSelectTemplate(template);
    onClose();
  };

  if (!isOpen) return null;

  const getCategoryColor = (category: SessionCategory) => {
    const colors: Record<SessionCategory, string> = {
      school: 'bg-blue-100 text-blue-800',
      programming: 'bg-green-100 text-green-800',
      language: 'bg-purple-100 text-purple-800',
      personal: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Load Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates by name or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No templates found</p>
              <p className="text-sm">Create a template from a session to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.title}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}
                    >
                      {template.category}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{template.duration} minutes</span>
                    <span className="capitalize">{template.priority} priority</span>
                    {template.tags.length > 0 && (
                      <span className="flex gap-1">
                        {template.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
