<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="border-b border-slate-800 px-5 py-3">
      <slot name="header" />
    </div>
    <div :class="contentClasses">
      <slot />
    </div>
    <div v-if="$slots.footer" class="border-t border-slate-800 px-5 py-3">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  noPadding?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  noPadding: false,
});

const cardClasses = computed(() => {
  const base = 'rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl backdrop-blur';
  
  const variants = {
    default: 'shadow-emerald-500/10',
    elevated: 'shadow-2xl shadow-emerald-500/20',
    outlined: 'shadow-none',
  };

  return `${base} ${variants[props.variant]}`;
});

const contentClasses = computed(() => {
  if (props.noPadding) return '';
  
  const paddings = {
    none: '',
    sm: 'px-3 py-2',
    md: 'px-5 py-4',
    lg: 'px-6 py-5',
  };

  return paddings[props.padding];
});
</script>


