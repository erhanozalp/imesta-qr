<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
});

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center font-medium rounded-full';

  const variants = {
    default: 'bg-white/[0.06] text-[#D3C4C4] border border-white/[0.12]',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    error: 'bg-red-500/20 text-red-300 border border-red-500/40',
    info: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return `${base} ${variants[props.variant]} ${sizes[props.size]}`;
});
</script>
