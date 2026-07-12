<template>
  <div :class="containerClasses">
    <span :class="dotClasses"></span>
    <span class="text-xs font-medium">{{ label || statusText }}</span>
    <span v-if="showPort && port" class="text-[#7E6E6E]">•</span>
    <span v-if="showPort && port" class="text-[#A89597] text-[11px]">
      Port: {{ port }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  status: 'listening' | 'closed' | 'error' | 'connecting';
  port?: string;
  label?: string;
  showPort?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showPort: true,
});

const statusText = computed(() => {
  const texts = {
    listening: 'Dinleniyor',
    closed: 'Kapalı',
    error: 'Hata',
    connecting: 'Bağlanıyor...',
  };
  return texts[props.status];
});

const containerClasses = computed(() => {
  return 'inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-[#1E1618] px-4 py-2 text-xs font-medium text-[#C9BABA]';
});

const dotClasses = computed(() => {
  const base = 'h-2 w-2 rounded-full';

  const statusClasses = {
    listening: 'bg-emerald-400 animate-pulse',
    closed: 'bg-amber-400 animate-pulse',
    error: 'bg-red-500 animate-pulse',
    connecting: 'bg-sky-400 animate-pulse',
  };

  return `${base} ${statusClasses[props.status]}`;
});
</script>
