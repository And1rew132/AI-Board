<template>
  <div class="ui-textarea-group">
    <label v-if="label" :for="textareaId" class="ui-textarea__label">
      {{ label }}
      <span v-if="required" class="ui-textarea__required">*</span>
    </label>
    
    <textarea
      :id="textareaId"
      :value="modelValue"
      :class="[
        'ui-textarea',
        { 'ui-textarea--error': error }
      ]"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      v-bind="$attrs"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    ></textarea>
    
    <span v-if="error" class="ui-textarea__error">{{ error }}</span>
    <span v-else-if="hint" class="ui-textarea__hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  rows: 3,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

// Generate unique ID for accessibility
const textareaId = props.id || `ui-textarea-${Math.random().toString(36).substr(2, 9)}`
</script>

<style scoped>
.ui-textarea-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
}

.ui-textarea__label {
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-gray-700, #343a40);
  font-size: var(--font-size-sm, 0.875rem);
}

.ui-textarea__required {
  color: var(--color-danger, #dc3545);
}

.ui-textarea {
  width: 100%;
  padding: var(--spacing-md, 0.75rem);
  border: 1px solid var(--color-gray-300, #ced4da);
  border-radius: var(--border-radius-md, 0.5rem);
  font-size: var(--font-size-base, 1rem);
  font-family: var(--font-family-sans);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background: var(--color-white, #ffffff);
  resize: vertical;
  min-height: 80px;
}

.ui-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #667eea);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.ui-textarea:disabled {
  background: var(--color-gray-50, #f8f9fa);
  border-color: var(--color-gray-200, #dee2e6);
  color: var(--color-gray-500, #6c757d);
  cursor: not-allowed;
  resize: none;
}

.ui-textarea--error {
  border-color: var(--color-danger, #dc3545);
}

.ui-textarea--error:focus {
  border-color: var(--color-danger, #dc3545);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.ui-textarea__error {
  color: var(--color-danger, #dc3545);
  font-size: var(--font-size-sm, 0.875rem);
}

.ui-textarea__hint {
  color: var(--color-gray-500, #6c757d);
  font-size: var(--font-size-sm, 0.875rem);
}
</style>