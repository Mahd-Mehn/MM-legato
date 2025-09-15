'use client';

import { Toaster, toast as hotToast, ToastOptions } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Custom toast component
const CustomToast = ({ 
  type, 
  message, 
  onDismiss 
}: { 
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: () => void;
}) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  };

  return (
    <div className={`flex items-center p-4 border rounded-lg shadow-lg ${bgColors[type]} max-w-sm`}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {message}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Enhanced toast functions
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <CustomToast
          type="success"
          message={message}
          onDismiss={() => hotToast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
        ...options,
      }
    );
  },

  error: (message: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <CustomToast
          type="error"
          message={message}
          onDismiss={() => hotToast.dismiss(t.id)}
        />
      ),
      {
        duration: 6000,
        ...options,
      }
    );
  },

  warning: (message: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <CustomToast
          type="warning"
          message={message}
          onDismiss={() => hotToast.dismiss(t.id)}
        />
      ),
      {
        duration: 5000,
        ...options,
      }
    );
  },

  info: (message: string, options?: ToastOptions) => {
    return hotToast.custom(
      (t) => (
        <CustomToast
          type="info"
          message={message}
          onDismiss={() => hotToast.dismiss(t.id)}
        />
      ),
      {
        duration: 4000,
        ...options,
      }
    );
  },

  loading: (message: string, options?: ToastOptions) => {
    return hotToast.loading(message, {
      duration: Infinity,
      ...options,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return hotToast.promise(promise, messages, options);
  },

  dismiss: (toastId?: string) => {
    hotToast.dismiss(toastId);
  },

  remove: (toastId?: string) => {
    hotToast.remove(toastId);
  },
};

// Toast provider component
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    />
  );
}