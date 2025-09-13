<template>
  <div class="ui-stat-card" :class="[variant && `ui-stat-card--${variant}`]">
    <div class="ui-stat-card__content">
      <div class="ui-stat-card__value">{{ value }}</div>
      <div class="ui-stat-card__label">{{ label }}</div>
      <div v-if="change" class="ui-stat-card__change" :class="changeDirection">
        <span class="ui-stat-card__change-icon">
          {{ changeDirection === 'up' ? '↗' : changeDirection === 'down' ? '↘' : '→' }}
        </span>
        {{ change }}
      </div>
    </div>
    <div v-if="icon" class="ui-stat-card__icon">
      {{ icon }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: string | number
  label: string
  icon?: string
  change?: string
  changeDirection?: 'up' | 'down' | 'neutral'
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const changeDirection = computed(() => {
  if (props.changeDirection) return props.changeDirection
  if (props.change && props.change.startsWith('+')) return 'up'
  if (props.change && props.change.startsWith('-')) return 'down'
  return 'neutral'
})
</script>

<style scoped>
.ui-stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xl, 1.25rem);
  background: var(--color-white, #ffffff);
  border-radius: var(--border-radius-lg, 0.75rem);
  border: 1px solid var(--color-gray-100, #e9ecef);
  transition: all 0.3s ease;
}

.ui-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 0 4px 15px rgba(0, 0, 0, 0.1));
}

.ui-stat-card--primary {
  background: rgba(102, 126, 234, 0.05);
  border-color: rgba(102, 126, 234, 0.1);
}

.ui-stat-card--success {
  background: rgba(40, 167, 69, 0.05);
  border-color: rgba(40, 167, 69, 0.1);
}

.ui-stat-card--warning {
  background: rgba(255, 193, 7, 0.05);
  border-color: rgba(255, 193, 7, 0.1);
}

.ui-stat-card--danger {
  background: rgba(220, 53, 69, 0.05);
  border-color: rgba(220, 53, 69, 0.1);
}

.ui-stat-card__content {
  flex: 1;
}

.ui-stat-card__value {
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-gray-800, #212529);
  margin-bottom: var(--spacing-xs, 0.25rem);
}

.ui-stat-card--primary .ui-stat-card__value {
  color: var(--color-primary, #667eea);
}

.ui-stat-card--success .ui-stat-card__value {
  color: var(--color-success, #28a745);
}

.ui-stat-card--warning .ui-stat-card__value {
  color: var(--color-warning, #ffc107);
}

.ui-stat-card--danger .ui-stat-card__value {
  color: var(--color-danger, #dc3545);
}

.ui-stat-card__label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gray-600, #495057);
  font-weight: var(--font-weight-medium, 500);
}

.ui-stat-card__change {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  margin-top: var(--spacing-xs, 0.25rem);
}

.ui-stat-card__change.up {
  color: var(--color-success, #28a745);
}

.ui-stat-card__change.down {
  color: var(--color-danger, #dc3545);
}

.ui-stat-card__change.neutral {
  color: var(--color-gray-500, #6c757d);
}

.ui-stat-card__change-icon {
  font-size: var(--font-size-base, 1rem);
}

.ui-stat-card__icon {
  font-size: var(--font-size-3xl, 1.875rem);
  color: var(--color-gray-400, #adb5bd);
  margin-left: var(--spacing-lg, 1rem);
}

.ui-stat-card--primary .ui-stat-card__icon {
  color: var(--color-primary, #667eea);
}

.ui-stat-card--success .ui-stat-card__icon {
  color: var(--color-success, #28a745);
}

.ui-stat-card--warning .ui-stat-card__icon {
  color: var(--color-warning, #ffc107);
}

.ui-stat-card--danger .ui-stat-card__icon {
  color: var(--color-danger, #dc3545);
}
</style>