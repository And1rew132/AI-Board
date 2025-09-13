<template>
  <div class="ui-select-group">
    <label v-if="label" :for="selectId" class="ui-select__label">
      {{ label }}
      <span v-if="required" class="ui-select__required">*</span>
    </label>
    
    <select
      :id="selectId"
      :value="modelValue"
      :class="[
        'ui-select',
        { 'ui-select--error': error }
      ]"
      :disabled="disabled"
      :required="required"
      v-bind="$attrs"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <slot />
    </select>
    
    <span v-if="error" class="ui-select__error">{{ error }}</span>
    <span v-else-if="hint" class="ui-select__hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
})

defineEmits<{
  'update:modelValue': [value: string | number]
}>()

// Generate unique ID for accessibility
const selectId = props.id || `ui-select-${Math.random().toString(36).substr(2, 9)}`
</script>

<style scoped>
.ui-select-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
}

.ui-select__label {
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-gray-700, #343a40);
  font-size: var(--font-size-sm, 0.875rem);
}

.ui-select__required {
  color: var(--color-danger, #dc3545);
}

.ui-select {
  width: 100%;
  padding: var(--spacing-md, 0.75rem);
  border: 1px solid var(--color-gray-300, #ced4da);
  border-radius: var(--border-radius-md, 0.5rem);
  font-size: var(--font-size-base, 1rem);
  font-family: var(--font-family-sans);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background: var(--color-white, #ffffff);
  cursor: pointer;
}

.ui-select:focus {
  outline: none;
  border-color: var(--color-primary, #667eea);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.ui-select:disabled {
  background: var(--color-gray-50, #f8f9fa);
  border-color: var(--color-gray-200, #dee2e6);
  color: var(--color-gray-500, #6c757d);
  cursor: not-allowed;
}

.ui-select--error {
  border-color: var(--color-danger, #dc3545);
}

.ui-select--error:focus {
  border-color: var(--color-danger, #dc3545);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.ui-select__error {
  color: var(--color-danger, #dc3545);
  font-size: var(--font-size-sm, 0.875rem);
}

.ui-select__hint {
  color: var(--color-gray-500, #6c757d);
  font-size: var(--font-size-sm, 0.875rem);
}
</style>