<template>
  <div :class="spinnerClasses" :style="spinnerStyle">
    <div class="h-full w-full animate-spin rounded-full border-2 border-current border-t-transparent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'bordo' | 'gold' | 'white';
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
    default: 'color: rgb(168 149 151)', // warm muted
    bordo: 'color: rgb(206 129 129)', // #CE8181
    gold: 'color: rgb(224 177 94)', // #E0B15E
    white: 'color: rgb(243 234 234)',
  };

  return colors[props.color];
});
</script>
