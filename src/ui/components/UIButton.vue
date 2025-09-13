<template>
  <button
    :class="[
      'ui-button',
      `ui-button--${variant}`,
      `ui-button--${size}`,
      { 'ui-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="ui-button__spinner"></span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
})
</script>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--border-radius-full, 25px);
  cursor: pointer;
  font-weight: var(--font-weight-medium, 500);
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
}

.ui-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.ui-button--sm {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1rem);
  font-size: var(--font-size-sm, 0.875rem);
}

.ui-button--md {
  padding: var(--spacing-md, 0.75rem) var(--spacing-xl, 1.25rem);
  font-size: var(--font-size-base, 1rem);
}

.ui-button--lg {
  padding: var(--spacing-lg, 1rem) var(--spacing-2xl, 1.5rem);
  font-size: var(--font-size-lg, 1.125rem);
}

/* Variants */
.ui-button--primary {
  background: var(--color-primary, #667eea);
  color: var(--color-white, #ffffff);
}

.ui-button--primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #5a67d8);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.1));
}

.ui-button--secondary {
  background: var(--color-gray-500, #6c757d);
  color: var(--color-white, #ffffff);
}

.ui-button--secondary:hover:not(:disabled) {
  background: var(--color-gray-600, #495057);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.1));
}

.ui-button--success {
  background: var(--color-success, #28a745);
  color: var(--color-white, #ffffff);
}

.ui-button--success:hover:not(:disabled) {
  background: var(--color-success-dark, #218838);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.1));
}

.ui-button--warning {
  background: var(--color-warning, #ffc107);
  color: var(--color-black, #000000);
}

.ui-button--warning:hover:not(:disabled) {
  background: var(--color-warning-dark, #e0a800);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.1));
}

.ui-button--danger {
  background: var(--color-danger, #dc3545);
  color: var(--color-white, #ffffff);
}

.ui-button--danger:hover:not(:disabled) {
  background: var(--color-danger-dark, #c82333);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.1));
}

.ui-button--ghost {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary, #667eea);
}

.ui-button--ghost:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.1));
}

/* Loading state */
.ui-button--loading {
  pointer-events: none;
}

.ui-button__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>