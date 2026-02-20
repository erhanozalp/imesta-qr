<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex min-w-[300px] max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur"
          :class="toastClasses(toast.type)"
          @click="removeToast(toast.id)"
        >
          <div class="flex-shrink-0 text-lg">
            {{ toastIcon(toast.type) }}
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="flex-shrink-0 text-slate-400 hover:text-slate-200 transition"
            @click.stop="removeToast(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';

const notificationsStore = useNotificationsStore();
const { toasts } = storeToRefs(notificationsStore);

const removeToast = (id: string) => {
  notificationsStore.removeToast(id);
};

const toastIcon = (type: string) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  return icons[type as keyof typeof icons] || 'ℹ️';
};

const toastClasses = (type: string) => {
  const base = 'bg-slate-950/95 text-slate-50';
  
  const variants = {
    success: `${base} border-emerald-500/50 shadow-emerald-500/20`,
    error: `${base} border-red-500/50 shadow-red-500/20`,
    warning: `${base} border-amber-500/50 shadow-amber-500/20`,
    info: `${base} border-sky-500/50 shadow-sky-500/20`,
  };

  return variants[type as keyof typeof variants] || variants.info;
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>


