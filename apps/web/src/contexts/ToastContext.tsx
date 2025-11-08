import { createContext, useContext, ReactNode } from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';
import { useTheme } from './ThemeContext';

type ToastFunction = typeof sonnerToast;

type ToastContextType = {
  success: ToastFunction['success'];
  error: ToastFunction['error'];
  warning: ToastFunction['warning'];
  info: ToastFunction['info'];
  promise: ToastFunction['promise'];
  loading: ToastFunction['loading'];
  custom: ToastFunction['custom'];
};

type ConfirmFunction = (message: string) => Promise<boolean>;

const ToastContext = createContext<ToastContextType | undefined>(undefined);
const ToastConfirmContext = createContext<ConfirmFunction | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const confirmToast: ConfirmFunction = (message: string) => {
    return new Promise((resolve) => {
      sonnerToast.custom(
        (t) => (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white mb-4">{message}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  sonnerToast.dismiss(t);
                  resolve(false);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  sonnerToast.dismiss(t);
                  resolve(true);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
        }
      );
    });
  };

  const toastFunctions: ToastContextType = {
    success: sonnerToast.success,
    error: sonnerToast.error,
    warning: sonnerToast.warning,
    info: sonnerToast.info,
    promise: sonnerToast.promise,
    loading: sonnerToast.loading,
    custom: sonnerToast.custom,
  };

  return (
    <ToastContext.Provider value={toastFunctions}>
      <ToastConfirmContext.Provider value={confirmToast}>
        <Toaster
          position="top-right"
          theme={theme}
          richColors
          closeButton
          duration={4000}
        />
        {children}
      </ToastConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function useToastConfirm() {
  const context = useContext(ToastConfirmContext);
  if (!context) {
    throw new Error('useToastConfirm must be used within ToastProvider');
  }
  return context;
}
