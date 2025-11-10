import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import Button from '../common/Button';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  accept = '.csv,.json,.xml',
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB`;
    }

    // Check file type
    const allowedExtensions = accept.split(',').map(ext => ext.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return `Only ${allowedExtensions.join(', ')} files are allowed`;
    }

    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect, maxSize, accept]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return <FileText className="w-6 h-6 text-green-500" />;
      case 'json':
        return <FileText className="w-6 h-6 text-yellow-500" />;
      case 'xml':
        return <FileText className="w-6 h-6 text-blue-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        className={`
          file-upload-zone relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragging 
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 animate-border-pulse' 
            : error 
              ? 'border-red-300 bg-red-50/50 dark:bg-red-900/20' 
              : selectedFile
                ? 'border-green-300 bg-green-50/50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile.name)}
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="w-4 h-4" />}
              onClick={handleClear}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Remove
            </Button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">
                Upload Error
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className={`
              p-3 rounded-full transition-all duration-300
              ${isDragging 
                ? 'bg-primary-100 dark:bg-primary-900 animate-upload-bounce' 
                : 'bg-gray-100 dark:bg-gray-700'
              }
            `}>
              <Upload className={`
                w-6 h-6 transition-colors duration-300
                ${isDragging 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
                }
              `} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                {isDragging ? 'Drop file here' : 'Drag and drop or click to browse'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supported formats: CSV, JSON, XML (max {formatFileSize(maxSize)})
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                <FileText className="w-3 h-3 text-green-500" />
                <span>CSV</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                <FileText className="w-3 h-3 text-yellow-500" />
                <span>JSON</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                <FileText className="w-3 h-3 text-blue-500" />
                <span>XML</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!selectedFile && !error && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Or{' '}
            <button
              type="button"
              onClick={handleClick}
              className="text-primary-600 hover:text-primary-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              disabled={disabled}
            >
              browse files
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
