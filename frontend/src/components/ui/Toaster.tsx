import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastCounter = 0;
const toasts: Toast[] = [];
const listeners: ((toasts: Toast[]) => void)[] = [];

export const toast = {
  success: (message: string) => {
    const id = `toast-${toastCounter++}`;
    toasts.push({ id, message, type: 'success' });
    notifyListeners();
    setTimeout(() => removeToast(id), 3000);
  },
  error: (message: string) => {
    const id = `toast-${toastCounter++}`;
    toasts.push({ id, message, type: 'error' });
    notifyListeners();
    setTimeout(() => removeToast(id), 5000);
  },
  info: (message: string) => {
    const id = `toast-${toastCounter++}`;
    toasts.push({ id, message, type: 'info' });
    notifyListeners();
    setTimeout(() => removeToast(id), 3000);
  },
};

const removeToast = (id: string) => {
  const index = toasts.findIndex(t => t.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
    notifyListeners();
  }
};

const notifyListeners = () => {
  listeners.forEach(listener => listener([...toasts]));
};

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => {
      const index = listeners.indexOf(setCurrentToasts);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            p-4 rounded-lg shadow-lg text-white font-medium
            animate-slide-down transition-all duration-200
            ${toast.type === 'success' ? 'bg-status-success' : ''}
            ${toast.type === 'error' ? 'bg-status-error' : ''}
            ${toast.type === 'info' ? 'bg-status-info' : ''}
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}