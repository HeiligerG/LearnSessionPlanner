import { useState, useEffect } from 'react';
import { FileText, Save, AlertCircle, Search } from 'lucide-react';
import type { CreateSessionDto, UpdateSessionDto, SessionResponse, TemplateResponse, CreateTemplateDto } from '@repo/shared-types';
import { SESSION_CATEGORIES, SESSION_STATUSES, SESSION_PRIORITIES } from '@repo/shared-types';
import { TemplateModal } from './TemplateModal';
import { SessionSearchModal } from './SessionSearchModal';
import { Tooltip } from '@/components/common/Tooltip';
import { Button } from '@/components/common/Button';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { validateSessionForm, validation } from '@/utils/validation';

interface SessionFormProps {
  session?: SessionResponse;
  onSubmit: (data: CreateSessionDto | UpdateSessionDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialDate?: Date;
  onTemplateSaved?: (template: TemplateResponse) => void;
  enableTemplates?: boolean;
  seedData?: Partial<CreateSessionDto>;
}

// Helper function to format Date to local datetime-local string (yyyy-MM-ddTHH:mm)
function formatDateToLocalInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function SessionForm({ session, onSubmit, onCancel, loading, initialDate, onTemplateSaved, enableTemplates = true, seedData }: SessionFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: 'programming' | 'school' | 'language' | 'personal' | 'other';
    status: 'planned' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    duration: number;
    scheduledFor: string;
    tags: string[];
    notes: string;
  }>({
    title: '',
    description: '',
    category: 'programming',
    status: 'planned',
    priority: 'medium',
    duration: 60,
    scheduledFor: '',
    tags: [],
    notes: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSessionSearchModalOpen, setIsSessionSearchModalOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (session) {
      // Edit mode: populate from existing session
      setFormData({
        title: session.title,
        description: session.description || '',
        category: session.category,
        status: session.status,
        priority: session.priority,
        duration: session.duration,
        scheduledFor: session.scheduledFor ? formatDateToLocalInput(new Date(session.scheduledFor)) : '',
        tags: session.tags || [],
        notes: session.notes || '',
      });
    } else if (seedData) {
      // Create mode with seed data from previous session: pre-fill all fields except scheduledFor
      setFormData(prev => ({
        ...prev,
        title: seedData.title || '',
        description: seedData.description || '',
        category: seedData.category || 'programming',
        priority: seedData.priority || 'medium',
        duration: seedData.duration || 60,
        tags: seedData.tags || [],
        notes: seedData.notes || '',
        // Leave scheduledFor blank and keep status as 'planned'
      }));
    } else if (initialDate) {
      // Create mode with initial date: pre-fill scheduledFor
      setFormData(prev => ({
        ...prev,
        scheduledFor: formatDateToLocalInput(initialDate),
      }));
    }
  }, [session, initialDate, seedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationResult = validateSessionForm(formData);
    if (!validationResult.isValid) {
      setValidationErrors(validationResult.errors);
      return;
    }

    setValidationErrors({});

    await onSubmit({
      ...formData,
      description: formData.description || undefined,
      scheduledFor: formData.scheduledFor || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });

    // Validate on change if field has been touched
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const validateField = (field: string, value: any) => {
    let error: string | undefined;

    switch (field) {
      case 'title':
        const titleResult = validation.title(value);
        error = titleResult.isValid ? undefined : titleResult.error;
        break;
      case 'description':
        const descResult = validation.description(value);
        error = descResult.isValid ? undefined : descResult.error;
        break;
      case 'duration':
        const durationResult = validation.duration(value);
        error = durationResult.isValid ? undefined : durationResult.error;
        break;
      case 'scheduledFor':
        const schedResult = validation.scheduledFor(value);
        error = schedResult.isValid ? undefined : schedResult.error;
        break;
      case 'tags':
        const tagsResult = validation.tags(value);
        error = tagsResult.isValid ? undefined : tagsResult.error;
        break;
      case 'notes':
        const notesResult = validation.notes(value);
        error = notesResult.isValid ? undefined : notesResult.error;
        break;
    }

    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleLoadTemplate = (template: TemplateResponse) => {
    setFormData({
      title: template.title,
      description: template.description || '',
      category: template.category,
      status: formData.status, // Keep current status
      priority: template.priority,
      duration: template.duration,
      scheduledFor: formData.scheduledFor, // Keep current scheduledFor
      tags: template.tags || [],
      notes: template.notes || '',
    });
  };

  const handleSaveAsTemplate = async () => {
    const nameValidation = validation.templateName(templateName);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error || 'Invalid template name');
      return;
    }

    const templateDto: CreateTemplateDto = {
      name: templateName.trim(),
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category,
      priority: formData.priority,
      duration: formData.duration,
      tags: formData.tags,
      notes: formData.notes || undefined,
    };

    setIsSavingTemplate(true);
    try {
      const res = await api.templates.create(templateDto);
      const savedTemplate = res.data;

      if (onTemplateSaved) {
        onTemplateSaved(savedTemplate);
      }

      setTemplateName('');
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template. Please try again.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleSelectPreviousSession = (previousSession: SessionResponse) => {
    // Pre-fill form with previous session data, keeping status as 'planned' and scheduledFor blank
    setFormData({
      title: previousSession.title,
      description: previousSession.description || '',
      category: previousSession.category,
      status: 'planned', // Always keep as planned for new session
      priority: previousSession.priority,
      duration: previousSession.duration,
      scheduledFor: '', // Leave blank
      tags: previousSession.tags || [],
      notes: previousSession.notes || '',
    });
    setIsSessionSearchModalOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Template Actions */}
        {enableTemplates && !session && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                variant="secondary"
                icon={<FileText className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Load Template
              </Button>
              <Button
                type="button"
                onClick={() => setIsSessionSearchModalOpen(true)}
                variant="secondary"
                icon={<Search className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Search Previous Sessions
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white min-h-[44px]"
              />
              <Button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={isSavingTemplate || !formData.title}
                variant="success"
                icon={<Save className="h-4 w-4" />}
                loading={isSavingTemplate}
                className="w-full sm:w-auto"
              >
                Save as Template
              </Button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            Title *
            <Tooltip content="A descriptive title for your learning session (3-200 characters)" position="right" />
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            onBlur={() => handleFieldBlur('title')}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all ${
              touched.title && validationErrors.title ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {touched.title && validationErrors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.title}
            </p>
          )}
        </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
          Description
          <Tooltip content="Optional details about your learning session (max 1000 characters)" position="right" />
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          onBlur={() => handleFieldBlur('description')}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all resize-none ${
            touched.description && validationErrors.description ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {touched.description && validationErrors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            {validationErrors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            Category *
            <Tooltip content="Categorize your learning session" position="top" />
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
          >
            {SESSION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            Status
            <Tooltip content="Track your session progress" position="top" />
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleFieldChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
          >
            {SESSION_STATUSES.map((status) => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            Priority
            <Tooltip content="Set the importance level" position="top" />
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleFieldChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
          >
            {SESSION_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            Duration (minutes) *
            <Tooltip content="How long you plan to study (5-480 minutes)" position="top" />
          </label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => handleFieldChange('duration', parseInt(e.target.value))}
            onBlur={() => handleFieldBlur('duration')}
            min={5}
            max={480}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all ${
              touched.duration && validationErrors.duration ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {touched.duration && validationErrors.duration && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.duration}
            </p>
          )}
          <div className="mt-2 flex gap-2 flex-wrap">
            {[15, 30, 45, 60, 90, 120].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => handleFieldChange('duration', min)}
                className={`px-3 py-1 text-xs rounded transition-all hover:scale-105 ${
                  formData.duration === min
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900'
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            Scheduled For
            <Tooltip content="When you plan to start this session (optional)" position="top" />
          </label>
          <input
            type="datetime-local"
            value={formData.scheduledFor}
            onChange={(e) => handleFieldChange('scheduledFor', e.target.value)}
            onBlur={() => handleFieldBlur('scheduledFor')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all ${
              touched.scheduledFor && validationErrors.scheduledFor ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {touched.scheduledFor && validationErrors.scheduledFor && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.scheduledFor}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
          Tags
          <Tooltip content="Add tags to organize your sessions (max 10 tags, 50 chars each)" position="top" />
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim() || formData.tags.length >= 10}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            Add
          </button>
        </div>
        {touched.tags && validationErrors.tags && (
          <p className="mb-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            {validationErrors.tags}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm transition-all hover:scale-105 animate-fade-in"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
          Notes
          <Tooltip content="Additional notes or observations (max 2000 characters)" position="top" />
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          onBlur={() => handleFieldBlur('notes')}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-all resize-none ${
            touched.notes && validationErrors.notes ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {touched.notes && validationErrors.notes && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            {validationErrors.notes}
          </p>
        )}
      </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
          <Button
            type="button"
            onClick={onCancel}
            disabled={loading}
            variant="ghost"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            loading={loading}
            className="w-full sm:w-auto"
          >
            {session ? 'Update Session' : 'Create Session'}
          </Button>
        </div>
      </form>

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleLoadTemplate}
      />

      <SessionSearchModal
        isOpen={isSessionSearchModalOpen}
        onClose={() => setIsSessionSearchModalOpen(false)}
        onSelectSession={handleSelectPreviousSession}
      />
    </>
  );
}
