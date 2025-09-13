<template>
  <div class="ui-progress-bar">
    <div class="ui-progress-bar__track">
      <div 
        class="ui-progress-bar__fill"
        :style="{ width: `${clampedValue}%` }"
      ></div>
    </div>
    <span v-if="showLabel" class="ui-progress-bar__label">
      {{ labelText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  max?: number
  showLabel?: boolean
  label?: string
  variant?: 'primary' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  showLabel: true,
  variant: 'primary',
})

const clampedValue = computed(() => {
  const percentage = (props.value / props.max) * 100
  return Math.min(Math.max(percentage, 0), 100)
})

const labelText = computed(() => {
  if (props.label) return props.label
  return `${Math.round(clampedValue.value)}%`
})
</script>

<style scoped>
.ui-progress-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 1rem);
}

.ui-progress-bar__track {
  flex: 1;
  height: 8px;
  background: var(--color-gray-200, #dee2e6);
  border-radius: var(--border-radius-full, 9999px);
  overflow: hidden;
}

.ui-progress-bar__fill {
  height: 100%;
  border-radius: var(--border-radius-full, 9999px);
  transition: width 0.3s ease;
  background: linear-gradient(90deg, var(--color-primary, #667eea), var(--color-secondary, #764ba2));
}

.ui-progress-bar__label {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-primary, #667eea);
  font-size: var(--font-size-sm, 0.875rem);
  min-width: fit-content;
}
</style>