<template>
  <div class="ui-tabs">
    <div class="ui-tabs__nav">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="[
          'ui-tabs__tab',
          { 'ui-tabs__tab--active': modelValue === tab.value }
        ]"
        @click="selectTab(tab.value)"
      >
        <span v-if="tab.icon" class="ui-tabs__icon">{{ tab.icon }}</span>
        {{ tab.label }}
        <span v-if="tab.badge" class="ui-tabs__badge">{{ tab.badge }}</span>
      </button>
    </div>
    
    <div class="ui-tabs__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  value: string
  label: string
  icon?: string
  badge?: string | number
}

interface Props {
  modelValue: string
  tabs: Tab[]
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function selectTab(value: string) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.ui-tabs {
  display: flex;
  flex-direction: column;
}

.ui-tabs__nav {
  display: flex;
  gap: var(--spacing-lg, 1rem);
  margin-bottom: var(--spacing-xl, 1.25rem);
  border-bottom: 2px solid var(--color-gray-100, #e9ecef);
  overflow-x: auto;
}

.ui-tabs__tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-lg, 1rem) var(--spacing-xl, 1.25rem);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-gray-600, #495057);
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: fit-content;
}

.ui-tabs__tab:hover {
  color: var(--color-gray-800, #212529);
  background: rgba(102, 126, 234, 0.1);
  border-radius: var(--border-radius-md, 0.5rem) var(--border-radius-md, 0.5rem) 0 0;
}

.ui-tabs__tab--active {
  color: var(--color-primary, #667eea);
  border-bottom-color: var(--color-primary, #667eea);
  background: rgba(102, 126, 234, 0.05);
}

.ui-tabs__icon {
  font-size: var(--font-size-lg, 1.125rem);
}

.ui-tabs__badge {
  background: var(--color-primary, #667eea);
  color: var(--color-white, #ffffff);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  border-radius: var(--border-radius-full, 9999px);
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  min-width: 1.5rem;
  text-align: center;
}

.ui-tabs__tab--active .ui-tabs__badge {
  background: var(--color-white, #ffffff);
  color: var(--color-primary, #667eea);
}

.ui-tabs__content {
  min-height: 400px;
}

/* Responsive */
@media (max-width: 768px) {
  .ui-tabs__nav {
    gap: var(--spacing-sm, 0.5rem);
  }
  
  .ui-tabs__tab {
    padding: var(--spacing-md, 0.75rem) var(--spacing-lg, 1rem);
    font-size: var(--font-size-sm, 0.875rem);
  }
}
</style>