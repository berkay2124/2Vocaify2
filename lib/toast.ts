/**
 * Enhanced Toast Notifications
 * Improved toast system with better UX
 */

import { toast as hotToast, ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#363636',
    color: '#fff',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '14px',
    maxWidth: '500px',
  },
};

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return hotToast.success(message, {
      ...defaultOptions,
      ...options,
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
      style: {
        ...defaultOptions.style,
        background: '#10b981',
        ...options?.style,
      },
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return hotToast.error(message, {
      ...defaultOptions,
      duration: 6000,
      ...options,
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
      style: {
        ...defaultOptions.style,
        background: '#ef4444',
        ...options?.style,
      },
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return hotToast.loading(message, {
      ...defaultOptions,
      ...options,
      style: {
        ...defaultOptions.style,
        background: '#3b82f6',
        ...options?.style,
      },
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return hotToast(message, {
      ...defaultOptions,
      ...options,
      icon: 'ℹ️',
      style: {
        ...defaultOptions.style,
        background: '#3b82f6',
        ...options?.style,
      },
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return hotToast(message, {
      ...defaultOptions,
      ...options,
      icon: '⚠️',
      style: {
        ...defaultOptions.style,
        background: '#f59e0b',
        ...options?.style,
      },
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
    return hotToast.promise(
      promise,
      messages,
      {
        ...defaultOptions,
        ...options,
      }
    );
  },

  custom: (message: string | React.ReactNode, options?: ToastOptions) => {
    return hotToast(message as any, {
      ...defaultOptions,
      ...options,
    });
  },

  dismiss: (toastId?: string) => {
    hotToast.dismiss(toastId);
  },
};
