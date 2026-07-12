<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="inputId" class="block text-xs font-medium text-[#C9BABA]">
      {{ label }}
      <span v-if="required" class="text-[#E08A8A]">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :autocomplete="autocomplete"
      :class="inputClasses"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
    <p v-if="error" class="text-xs text-[#E08A8A]">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-[#A89597]">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: string;
  label?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autocomplete?: string;
  error?: string;
  hint?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
});

defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}>();

const inputId = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`);

const inputClasses = computed(() => {
  const base = 'w-full rounded-xl border bg-black/25 px-3.5 py-2.5 text-sm text-[#F3EAEA] shadow-sm outline-none transition placeholder:text-[#7E6E6E]';

  if (props.error) {
    return `${base} border-[#C0392B]/50 focus:border-[#D98A8A] focus:ring-2 focus:ring-[#C0392B]/30`;
  }

  return `${base} border-white/[0.12] focus:border-[#9A4B4B] focus:ring-2 focus:ring-[#773030]/40 disabled:cursor-not-allowed disabled:opacity-60`;
});
</script>
