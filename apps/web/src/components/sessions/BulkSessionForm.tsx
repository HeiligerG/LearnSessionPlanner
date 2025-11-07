import { useState, useCallback } from 'react';
import type {
  CreateSessionDto,
  BulkCreateSessionDto,
  RecurrencePattern,
  SessionCategory,
  SessionPriority,
} from '@repo/shared-types';
import { SESSION_CATEGORIES, SESSION_PRIORITIES } from '@repo/shared-types';

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

// Helper function to parse CSV line respecting quotes
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Push last field
  result.push(current.trim());
  return result;
};

export function BulkSessionForm({
  onSubmit,
  onCancel,
  loading = false,
  initialDate,
}: BulkSessionFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [manualSessions, setManualSessions] = useState<CreateSessionDto[]>([
    { ...EMPTY_SESSION, scheduledFor: initialDate?.toISOString() || new Date().toISOString() },
  ]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CreateSessionDto[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
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

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Split by CRLF or LF, filter empty lines
        const lines = text.split(/\r?\n/).filter((line) => line.trim());

        if (lines.length < 2) {
          setCsvError('CSV file must have at least a header row and one data row');
          return;
        }

        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
        const parsed: CreateSessionDto[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const session: any = {};

          headers.forEach((header, index) => {
            const value = values[index] || '';
            // Remove surrounding quotes if present
            const cleanValue = value.replace(/^"(.*)"$/, '$1');

            if (header === 'title') session.title = cleanValue;
            else if (header === 'category') session.category = cleanValue;
            else if (header === 'duration') session.duration = parseInt(cleanValue, 10);
            else if (header === 'scheduledfor') session.scheduledFor = cleanValue;
            else if (header === 'priority') session.priority = cleanValue;
            else if (header === 'description') session.description = cleanValue;
            else if (header === 'tags') session.tags = cleanValue ? cleanValue.split(';') : [];
          });

          if (!session.title || !session.category || !session.duration) {
            setCsvError(`Row ${i + 1}: Missing required fields (title, category, duration)`);
            return;
          }

          parsed.push(session as CreateSessionDto);
        }

        setCsvData(parsed);
      } catch (err) {
        setCsvError(`Failed to parse CSV file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    reader.readAsText(file);
  }, []);

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
    } else if (activeTab === 'csv') {
      dto = { sessions: csvData };
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
            CSV Import
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
                <button
                  type="button"
                  onClick={() => setManualSessions(manualSessions.filter((_, i) => i !== index))}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md col-span-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setManualSessions([...manualSessions, { ...EMPTY_SESSION }])}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            + Add Another Session
          </button>
        </div>
      )}

      {/* CSV Import Tab */}
      {activeTab === 'csv' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              CSV format: title,category,duration,scheduledFor,priority,description,tags
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Valid categories: {SESSION_CATEGORIES.join(', ')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Example: "Math Study,school,60,2025-01-15T10:00:00Z,high,Algebra review,math;algebra"
            </p>
          </div>
          {csvError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-800 dark:text-red-200">{csvError}</p>
            </div>
          )}
          {csvData.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview ({csvData.length} sessions):
              </p>
              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Title</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {csvData.slice(0, 5).map((session, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{session.title}</td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{session.category}</td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{session.duration}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 5 && (
                  <p className="p-2 text-sm text-gray-500 dark:text-gray-400">... and {csvData.length - 5} more</p>
                )}
              </div>
            </div>
          )}
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

            <button
              type="button"
              onClick={generateRecurrencePreview}
              className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
            >
              Generate Preview
            </button>

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
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || (activeTab === 'csv' && csvData.length === 0)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Sessions'}
        </button>
      </div>
    </form>
  );
}
