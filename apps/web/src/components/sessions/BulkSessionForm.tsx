import { useState, useCallback } from 'react';
import type {
  CreateSessionDto,
  BulkCreateSessionDto,
  RecurrencePattern,
  SessionCategory,
  SessionPriority,
  FileImportResultDto,
} from '@repo/shared-types';
import { SESSION_CATEGORIES, SESSION_PRIORITIES } from '@repo/shared-types';
import { Button } from '@/components/common/Button';
import { ProgressRing } from '@/components/common/ProgressRing';
import FileUploadZone from './FileUploadZone';
import ImportPreviewTable from './ImportPreviewTable';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface BulkSessionFormProps {
  onSubmit: (dto: BulkCreateSessionDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialDate?: Date;
}

type TabType = 'manual' | 'csv' | 'recurrence';

const EMPTY_SESSION: CreateSessionDto = {
  title: '',
  category: 'programming',
  duration: 60,
  priority: 'medium',
  scheduledFor: new Date().toISOString(),
};


export function BulkSessionForm({
  onSubmit,
  onCancel,
  loading = false,
  initialDate,
}: BulkSessionFormProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [manualSessions, setManualSessions] = useState<CreateSessionDto[]>([
    { ...EMPTY_SESSION, scheduledFor: initialDate?.toISOString() || new Date().toISOString() },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<FileImportResultDto | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [recurrenceBase, setRecurrenceBase] = useState<CreateSessionDto>({
    ...EMPTY_SESSION,
    scheduledFor: initialDate?.toISOString() || new Date().toISOString(),
  });
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>({
    frequency: 'daily',
    interval: 1,
    endType: 'count',
    endCount: 7,
  });
  const [previewSessions, setPreviewSessions] = useState<CreateSessionDto[]>([]);

  // New file upload functions
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    const toastId = toast.loading('Uploading and parsing file...');
    
    try {
      const response = await api.sessions.importFile(file, (progress) => {
        setUploadProgress(progress);
      });
      
      if (response.data) {
        setImportResult(response.data);
        setUploadStatus('success');
        toast.success(`Parsed successfully: ${response.data.summary.successfulRows} valid, ${response.data.summary.failedRows} errors`);
      }
    } catch (error: any) {
      setUploadStatus('error');
      setUploadProgress(0);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const handleImportValid = useCallback(async () => {
    if (!importResult) return;
    
    const validRows = importResult.rows.filter(row => 
      row.status === 'success' || row.status === 'warning'
    );
    
    if (validRows.length === 0) {
      toast.error('No valid sessions to import');
      return;
    }

    try {
      await onSubmit({
        sessions: validRows.map(row => row.session)
      });
      
      toast.success(`Successfully imported ${validRows.length} sessions`);
      setImportResult(null);
      setSelectedFile(null);
      setUploadStatus('idle');
    } catch (error) {
      // Error handled by parent component
    }
  }, [importResult, onSubmit, toast]);

  const handleClear = useCallback(() => {
    setImportResult(null);
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
  }, []);

  const downloadSample = useCallback(async (format: 'csv' | 'json' | 'xml') => {
    try {
      const blob = await api.sessions.downloadSample(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sessions-sample.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${format.toUpperCase()} sample file`);
    } catch (error: any) {
      toast.error(`Download failed: ${error.message}`);
    }
  }, [toast]);


  const generateRecurrencePreview = useCallback(() => {
    const preview: CreateSessionDto[] = [];
    const startDate = new Date(recurrenceBase.scheduledFor || new Date());
    let currentDate = new Date(startDate);
    let count = 0;
    const maxOccurrences = recurrencePattern.endType === 'never' ? 365 : (recurrencePattern.endCount || 10);

    while (count < maxOccurrences) {
      // Check end date condition
      if (recurrencePattern.endType === 'date' && recurrencePattern.endDate) {
        if (currentDate > new Date(recurrencePattern.endDate)) break;
      }

      // For weekly with specific days
      if (recurrencePattern.frequency === 'weekly' && recurrencePattern.daysOfWeek && recurrencePattern.daysOfWeek.length > 0) {
        const dayOfWeek = currentDate.getDay();
        if (recurrencePattern.daysOfWeek.includes(dayOfWeek)) {
          preview.push({
            ...recurrenceBase,
            scheduledFor: currentDate.toISOString(),
          });
          count++;
        }
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        // Daily and monthly, or weekly without specific days
        preview.push({
          ...recurrenceBase,
          scheduledFor: currentDate.toISOString(),
        });
        count++;

        // Increment based on frequency
        if (recurrencePattern.frequency === 'daily') {
          currentDate.setDate(currentDate.getDate() + recurrencePattern.interval);
        } else if (recurrencePattern.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + recurrencePattern.interval * 7);
        } else if (recurrencePattern.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + recurrencePattern.interval);
          if (recurrencePattern.dayOfMonth) {
            currentDate.setDate(recurrencePattern.dayOfMonth);
          }
        }
      }

      // Check count condition
      if (recurrencePattern.endType === 'count' && count >= maxOccurrences) break;

      // Safety check to prevent infinite loops
      if (count >= 365) break;
    }

    setPreviewSessions(preview);
  }, [recurrenceBase, recurrencePattern]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let dto: BulkCreateSessionDto;

    if (activeTab === 'manual') {
      dto = { sessions: manualSessions };
    } else if (activeTab === 'csv' && importResult) {
      // Use the modern file import workflow
      const validRows = importResult.rows.filter(row => 
        row.status === 'success' || row.status === 'warning'
      );
      dto = { sessions: validRows.map(row => row.session) };
    } else if (activeTab === 'csv') {
      // Fallback: no valid sessions to import
      toast.error('No valid sessions to import');
      return;
    } else {
      dto = { sessions: [recurrenceBase], recurrence: recurrencePattern };
    }

    await onSubmit(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'csv'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            File Import
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recurrence')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'recurrence'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Recurrence Pattern
          </button>
        </nav>
      </div>

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          {manualSessions.map((session, index) => (
            <div key={index} className="grid grid-cols-2 gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <input
                type="text"
                placeholder="Title"
                value={session.title}
                onChange={(e) => {
                  const updated = [...manualSessions];
                  updated[index].title = e.target.value;
                  setManualSessions(updated);
                }}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                required
              />
              <select
                value={session.category}
                onChange={(e) => {
                  const updated = [...manualSessions];
                  updated[index].category = e.target.value as SessionCategory;
                  setManualSessions(updated);
                }}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              >
                {SESSION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Duration (minutes)"
                value={session.duration}
                onChange={(e) => {
                  const updated = [...manualSessions];
                  updated[index].duration = parseInt(e.target.value, 10);
                  setManualSessions(updated);
                }}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                required
              />
              <select
                value={session.priority || 'medium'}
                onChange={(e) => {
                  const updated = [...manualSessions];
                  updated[index].priority = e.target.value as SessionPriority;
                  setManualSessions(updated);
                }}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              >
                {SESSION_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={session.scheduledFor?.slice(0, 16)}
                onChange={(e) => {
                  const updated = [...manualSessions];
                  updated[index].scheduledFor = new Date(e.target.value).toISOString();
                  setManualSessions(updated);
                }}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white col-span-2"
              />
              {manualSessions.length > 1 && (
                <Button
                  type="button"
                  onClick={() => setManualSessions(manualSessions.filter((_, i) => i !== index))}
                  variant="danger"
                  size="sm"
                  className="col-span-2"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            onClick={() => setManualSessions([...manualSessions, { ...EMPTY_SESSION }])}
            variant="secondary"
          >
            + Add Another Session
          </Button>
        </div>
      )}

      {/* File Import Tab */}
      {activeTab === 'csv' && (
        <div className="space-y-4">
          {/* File Upload Zone */}
          <FileUploadZone 
            onFileSelect={handleFileSelect} 
            accept=".csv,.json,.xml" 
            maxSize={5*1024*1024} 
            disabled={isUploading || loading} 
          />

          {/* Upload Progress Visualization */}
          {isUploading && (
            <div 
              className="glass-card p-6 text-center space-y-4 rounded-xl border border-primary-200 dark:border-primary-800 transition-opacity duration-300" 
              aria-live="polite" 
              role="status"
            >
              <ProgressRing 
                size="lg" 
                progress={uploadProgress} 
                strokeWidth={6} 
                color={uploadStatus === 'error' ? 'danger' : 'primary'} 
                animated 
                showPercentage 
                label="Uploading and parsing file..." 
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading and parsing your file</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{uploadProgress}% complete</p>
              </div>
              {uploadStatus === 'error' && (
                <div className="flex items-center justify-center gap-3 text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5" aria-hidden="true"/>
                  <span className="text-sm">Upload failed. Please check your file and try again.</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setUploadStatus('idle'); 
                      setImportResult(null); 
                      setSelectedFile(null);
                    }} 
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Retry
                  </Button>
                </div>
              )}
              <div className="flex justify-center">
                <div className="w-24 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${uploadStatus === 'error' ? 'bg-red-500' : 'bg-primary-500 animate-pulse'}`} 
                    style={{width: `${uploadProgress}%`}} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadStatus === 'success' && !importResult && (
            <div className="glass-card p-4 text-center animate-success-pulse mt-4">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2 animate-pulse"/>
              <p className="text-green-600 dark:text-green-400">Parsing complete!</p>
            </div>
          )}

          {/* Import Preview Table */}
          {importResult && (
            <div className="space-y-4">
              <ImportPreviewTable 
                rows={importResult.rows} 
                onRemoveRow={(rowNum) => setImportResult(prev => ({
                  ...prev!, 
                  rows: prev!.rows.filter(r => r.rowNumber !== rowNum)
                }))} 
              />
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-end mt-4">
                <Button 
                  variant="primary" 
                  onClick={handleImportValid} 
                  disabled={!importResult || importResult.rows.filter(r => r.status !== 'error').length === 0}
                >
                  Import Valid Sessions ({importResult.rows.filter(r => r.status !== 'error').length})
                </Button>
                <Button variant="ghost" onClick={handleClear}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Sample Files */}
          <div className="glass-card p-4 mt-4">
            <h3 className="font-medium mb-3">Sample Files</h3>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => downloadSample('csv')}>
                CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={() => downloadSample('json')}>
                JSON
              </Button>
              <Button variant="secondary" size="sm" onClick={() => downloadSample('xml')}>
                XML
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Supported: CSV, JSON, XML. Max 5MB.</p>
          </div>

          {/* Format Info */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Supported formats: <span className="font-mono text-green-600">CSV</span>, <span className="font-mono text-yellow-600">JSON</span>, <span className="font-mono text-blue-600">XML</span>
          </p>
        </div>
      )}

      {/* Recurrence Pattern Tab */}
      {activeTab === 'recurrence' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Title"
              value={recurrenceBase.title}
              onChange={(e) => setRecurrenceBase({ ...recurrenceBase, title: e.target.value })}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              required
            />
            <select
              value={recurrenceBase.category}
              onChange={(e) => setRecurrenceBase({ ...recurrenceBase, category: e.target.value as SessionCategory })}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            >
              {SESSION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={recurrenceBase.duration}
              onChange={(e) => setRecurrenceBase({ ...recurrenceBase, duration: parseInt(e.target.value, 10) })}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              required
            />
            <select
              value={recurrenceBase.priority || 'medium'}
              onChange={(e) => setRecurrenceBase({ ...recurrenceBase, priority: e.target.value as SessionPriority })}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            >
              {SESSION_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={recurrenceBase.scheduledFor?.slice(0, 16)}
              onChange={(e) => setRecurrenceBase({ ...recurrenceBase, scheduledFor: new Date(e.target.value).toISOString() })}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white col-span-2"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recurrence Pattern</h4>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={recurrencePattern.frequency}
                onChange={(e) => setRecurrencePattern({ ...recurrencePattern, frequency: e.target.value as any })}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Every</span>
                <input
                  type="number"
                  min="1"
                  value={recurrencePattern.interval}
                  onChange={(e) => setRecurrencePattern({ ...recurrencePattern, interval: parseInt(e.target.value, 10) })}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white w-20"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{recurrencePattern.frequency}</span>
              </div>
            </div>

            {/* Days of Week for weekly recurrence */}
            {recurrencePattern.frequency === 'weekly' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <label key={index} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={recurrencePattern.daysOfWeek?.includes(index) || false}
                        onChange={(e) => {
                          const days = recurrencePattern.daysOfWeek || [];
                          if (e.target.checked) {
                            setRecurrencePattern({ ...recurrencePattern, daysOfWeek: [...days, index].sort() });
                          } else {
                            setRecurrencePattern({ ...recurrencePattern, daysOfWeek: days.filter(d => d !== index) });
                          }
                        }}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Day of Month for monthly recurrence */}
            {recurrencePattern.frequency === 'monthly' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={recurrencePattern.dayOfMonth || ''}
                  onChange={(e) => setRecurrencePattern({ ...recurrencePattern, dayOfMonth: parseInt(e.target.value, 10) })}
                  placeholder="Leave empty for current day"
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white w-32"
                />
              </div>
            )}

            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={recurrencePattern.endType === 'count'}
                  onChange={() => setRecurrencePattern({ ...recurrencePattern, endType: 'count' })}
                  className="text-primary-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">After</span>
                <input
                  type="number"
                  min="1"
                  value={recurrencePattern.endCount || 7}
                  onChange={(e) => setRecurrencePattern({ ...recurrencePattern, endCount: parseInt(e.target.value, 10), endType: 'count' })}
                  className="px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white w-20"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">occurrences</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={recurrencePattern.endType === 'date'}
                  onChange={() => setRecurrencePattern({ ...recurrencePattern, endType: 'date' })}
                  className="text-primary-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">On date</span>
                <input
                  type="date"
                  value={recurrencePattern.endDate?.slice(0, 10) || ''}
                  onChange={(e) => setRecurrencePattern({ ...recurrencePattern, endDate: new Date(e.target.value).toISOString(), endType: 'date' })}
                  className="px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={recurrencePattern.endType === 'never'}
                  onChange={() => setRecurrencePattern({ ...recurrencePattern, endType: 'never' })}
                  className="text-primary-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Never (max 365 occurrences)</span>
              </label>
            </div>

            <Button
              type="button"
              onClick={generateRecurrencePreview}
              variant="primary"
              className="mt-3"
            >
              Generate Preview
            </Button>

            {previewSessions.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview ({previewSessions.length} sessions):
                </p>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {previewSessions.slice(0, 10).map((session, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(session.scheduledFor!).toLocaleDateString()} - {session.title}
                    </li>
                  ))}
                  {previewSessions.length > 10 && (
                    <li className="text-sm text-gray-500 dark:text-gray-500">... and {previewSessions.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          onClick={onCancel}
          disabled={loading}
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || (activeTab === 'csv' && (!importResult || importResult.rows.filter(r => r.status !== 'error').length === 0))}
          variant="primary"
          loading={loading}
        >
          Create Sessions
        </Button>
      </div>
    </form>
  );
}
