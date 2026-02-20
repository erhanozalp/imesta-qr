<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
  fullWidth: false,
});

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-60';
  
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-400 to-sky-400 text-slate-950 shadow-lg shadow-emerald-500/30 hover:brightness-110',
    secondary: 'bg-slate-800 text-slate-50 border border-slate-700 hover:bg-slate-700 hover:border-slate-600',
    danger: 'bg-red-500 text-white shadow-md shadow-red-500/30 hover:bg-red-600',
    ghost: 'text-slate-300 hover:bg-slate-800 hover:text-slate-50',
    outline: 'border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800',
  };

  const sizes = {
    sm: 'rounded-lg px-2.5 py-1.5 text-xs',
    md: 'rounded-xl px-3.5 py-2 text-sm',
    lg: 'rounded-xl px-4 py-2.5 text-base',
  };

  return [
    base,
    variants[props.variant],
    sizes[props.size],
    props.fullWidth && 'w-full',
  ].filter(Boolean).join(' ');
});
</script>


