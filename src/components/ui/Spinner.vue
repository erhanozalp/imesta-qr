<template>
  <div :class="spinnerClasses" :style="spinnerStyle">
    <div class="h-full w-full animate-spin rounded-full border-2 border-current border-t-transparent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'emerald' | 'sky' | 'white';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'default',
});

const spinnerClasses = computed(() => {
  const sizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  return sizes[props.size];
});

const spinnerStyle = computed(() => {
  const colors = {
    default: 'color: rgb(148 163 184)', // slate-400
    emerald: 'color: rgb(52 211 153)', // emerald-400
    sky: 'color: rgb(56 189 248)', // sky-400
    white: 'color: rgb(255 255 255)',
  };

  return colors[props.color];
});
</script>


