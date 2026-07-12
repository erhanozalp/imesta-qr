<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="border-b border-white/[0.08] px-5 py-3">
      <slot name="header" />
    </div>
    <div :class="contentClasses">
      <slot />
    </div>
    <div v-if="$slots.footer" class="border-t border-white/[0.08] px-5 py-3">
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
  const base = 'rounded-2xl border border-white/[0.08] bg-[#1E1618]';

  const variants = {
    default: 'shadow-xl shadow-black/30',
    elevated: 'shadow-2xl shadow-black/40',
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
