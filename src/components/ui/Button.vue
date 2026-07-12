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
  const base = 'inline-flex items-center justify-center font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary: 'border border-[#9A4B4B] bg-[#7C3434] text-[#F6E4E4] hover:bg-[#8A3B3B]',
    secondary: 'border border-white/[0.12] bg-white/[0.06] text-[#F3EAEA] hover:border-white/20 hover:bg-white/[0.1]',
    danger: 'bg-[#C0392B] text-white hover:bg-[#A93226]',
    ghost: 'text-[#C9BABA] hover:bg-white/[0.06] hover:text-[#F3EAEA]',
    outline: 'border border-white/[0.12] bg-white/[0.03] text-[#D3C4C4] hover:border-white/25 hover:bg-white/[0.07]',
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


