import { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Trash2, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import type { ParsedSessionRowDto } from '@repo/shared-types';
import { categoryStyles } from '../../utils/categoryStyles';
import Button from '../common/Button';

interface ImportPreviewTableProps {
  rows: ParsedSessionRowDto[];
  onRemoveRow?: (rowNumber: number) => void;
  maxRows?: number;
}

const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({
  rows,
  onRemoveRow,
  maxRows = 100,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and search rows
  const filteredRows = useMemo(() => {
    return rows
      .filter(row => {
        const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
        const matchesSearch = searchTerm === '' || 
          row.session.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .slice(0, maxRows);
  }, [rows, statusFilter, searchTerm, maxRows]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = rows.length;
    const successful = rows.filter(row => row.status === 'success').length;
    const warnings = rows.filter(row => row.status === 'warning').length;
    const errors = rows.filter(row => row.status === 'error').length;
    const duplicates = rows.filter(row => row.isDuplicate).length;

    return { total, successful, warnings, errors, duplicates };
  }, [rows]);

  const toggleRowExpansion = (rowNumber: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowNumber)) {
      newExpanded.delete(rowNumber);
    } else {
      newExpanded.add(rowNumber);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'warning' | 'error') => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300`;
    }
  };

  const getCategoryBadge = (category: string) => {
    const style = categoryStyles[category as keyof typeof categoryStyles] || categoryStyles.other;
    return `px-2 py-1 text-xs font-medium rounded-full ${style.textColor} ${style.lightBg}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const downloadReport = () => {
    const report = {
      summary,
      rows: rows.map(row => ({
        rowNumber: row.rowNumber,
        status: row.status,
        session: row.session,
        errors: row.errors,
        warnings: row.warnings,
        isDuplicate: row.isDuplicate,
      })),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-import-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (rows.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-gray-400 dark:text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            No sessions to preview
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Upload a file to see the parsed sessions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.total}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.successful}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {summary.warnings}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {summary.errors}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Errors</div>
            </div>
            {summary.duplicates > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {summary.duplicates}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Duplicates</div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={downloadReport}
            >
              Download Report
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All ({rows.length})</option>
              <option value="success">Success ({summary.successful})</option>
              <option value="warning">Warnings ({summary.warnings})</option>
              <option value="error">Errors ({summary.errors})</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search:
            </label>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {filteredRows.length < rows.length && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredRows.length} of {rows.length} rows
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Row
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scheduled For
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                {onRemoveRow && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRows.flatMap((row) => [
                // Main row
                <tr 
                  key={`main-${row.rowNumber}`}
                  className={`\
                    hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer min-h-[44px]\
                    ${expandedRows.has(row.rowNumber) ? 'bg-gray-50 dark:bg-gray-800/30' : ''}\
                    animate-table-row-appear stagger-delay-${(row.rowNumber % 6) + 1}\
                  `}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedRows.has(row.rowNumber)}
                  aria-label={`Toggle details for row ${row.rowNumber}`}
                  onClick={() => toggleRowExpansion(row.rowNumber)}
                  onKeyDown={(e) => e.key === 'Enter' && toggleRowExpansion(row.rowNumber)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(row.status)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {row.rowNumber}
                      </span>
                      {expandedRows.has(row.rowNumber) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {row.session.title}
                    </div>
                    {row.isDuplicate && (
                      <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Duplicate
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={getCategoryBadge(row.session.category)}>
                      {row.session.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {row.session.duration} min
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {formatDate(row.session.scheduledFor)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={getStatusBadge(row.status)}>
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                  </td>
                  {onRemoveRow && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRow(row.rowNumber);
                        }}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label={`Remove row ${row.rowNumber}`}
                      />
                    </td>
                  )}
                </tr>,
                
                // Detail row (conditionally rendered)
                expandedRows.has(row.rowNumber) && (
                  <tr 
                    key={`detail-${row.rowNumber}`}
                    className="bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700 transition-all duration-300"
                    aria-hidden={!expandedRows.has(row.rowNumber)}
                  >
                    <td colSpan={onRemoveRow ? 7 : 6} className="px-4 py-3">
                      <div className="overflow-hidden transition-max-height duration-300" style={{maxHeight: expandedRows.has(row.rowNumber) ? '200px' : '0'}}>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {row.errors.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                                  Errors:
                                </h4>
                                <ul className="text-sm text-red-700 dark:text-red-300 space-y-0.5 list-disc list-inside pl-4">
                                  {row.errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {row.warnings.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                                  Warnings:
                                </h4>
                                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-0.5 list-disc list-inside pl-4">
                                  {row.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {row.errors.length === 0 && row.warnings.length === 0 && (
                            <p className="text-sm italic text-gray-500 dark:text-gray-400">
                              No issues detected.
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              ]).filter(Boolean)}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No sessions match the current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPreviewTable;
