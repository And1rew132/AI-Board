<template>
  <span
    :class="[
      'ui-badge',
      `ui-badge--${variant}`,
      `ui-badge--${size}`,
    ]"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray'
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
})
</script>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-full, 9999px);
  font-weight: var(--font-weight-medium, 500);
  white-space: nowrap;
}

/* Sizes */
.ui-badge--sm {
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  font-size: var(--font-size-xs, 0.75rem);
}

.ui-badge--md {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 0.75rem);
  font-size: var(--font-size-sm, 0.875rem);
}

.ui-badge--lg {
  padding: var(--spacing-md, 0.75rem) var(--spacing-lg, 1rem);
  font-size: var(--font-size-base, 1rem);
}

/* Variants */
.ui-badge--primary {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary, #667eea);
}

.ui-badge--secondary {
  background: rgba(118, 75, 162, 0.1);
  color: var(--color-secondary, #764ba2);
}

.ui-badge--success {
  background: var(--color-success-light, #d4edda);
  color: var(--color-success-dark, #155724);
}

.ui-badge--warning {
  background: var(--color-warning-light, #fff3cd);
  color: var(--color-warning-dark, #856404);
}

.ui-badge--danger {
  background: var(--color-danger-light, #f8d7da);
  color: var(--color-danger-dark, #721c24);
}

.ui-badge--gray {
  background: var(--color-gray-100, #e9ecef);
  color: var(--color-gray-700, #343a40);
}
</style>