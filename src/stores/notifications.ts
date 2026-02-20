import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}

export const useNotificationsStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([]);
  const DEFAULT_DURATION = 4000; // 4 saniye

  function addToast(type: Toast['type'], message: string, duration?: number) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = {
      id,
      type,
      message,
      duration: duration ?? DEFAULT_DURATION,
      timestamp: Date.now(),
    };

    toasts.value.push(toast);

    // Otomatik kaldırma
    if ((toast.duration ?? 0) > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration!);
    }

    return id;
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }

  function clearAll() {
    toasts.value = [];
  }

  // Helper functions
  function success(message: string, duration?: number) {
    return addToast('success', message, duration);
  }

  function error(message: string, duration?: number) {
    return addToast('error', message, duration);
  }

  function warning(message: string, duration?: number) {
    return addToast('warning', message, duration);
  }

  function info(message: string, duration?: number) {
    return addToast('info', message, duration);
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };
});


