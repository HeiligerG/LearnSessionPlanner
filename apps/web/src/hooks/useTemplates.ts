import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import type {
  TemplateResponse,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFilters,
} from '@repo/shared-types';

export function useTemplates(initialFilters?: TemplateFilters) {
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TemplateFilters | undefined>(initialFilters);

  const fetchTemplates = useCallback(async (filterOverride?: TemplateFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.templates.getAll(filterOverride || filters);
      // Extract templates from the nested response structure
      const data = response.data?.data || [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch templates'));
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createTemplate = useCallback(async (dto: CreateTemplateDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.templates.create(dto);
      const newTemplate = response.data;
      if (newTemplate) {
        setTemplates((prev) => [newTemplate, ...prev]);
      }
      return newTemplate;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create template'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, dto: UpdateTemplateDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.templates.update(id, dto);
      const updatedTemplate = response.data;
      if (updatedTemplate) {
        setTemplates((prev) =>
          prev.map((template) => (template.id === id ? updatedTemplate : template))
        );
      }
      return updatedTemplate;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update template'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.templates.delete(id);
      setTemplates((prev) => prev.filter((template) => template.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete template'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchTemplates = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.templates.search(query);
      const data = response.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search templates'));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const updateFilters = useCallback((newFilters: TemplateFilters) => {
    setFilters(newFilters);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    filters,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    refetch,
    updateFilters,
  };
}
