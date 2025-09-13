<template>
  <div class="ui-info-grid">
    <div 
      v-for="item in items" 
      :key="item.label"
      class="ui-info-grid__item"
    >
      <span class="ui-info-grid__label">{{ item.label }}:</span>
      <span class="ui-info-grid__value">{{ item.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface InfoItem {
  label: string
  value: string | number
}

interface Props {
  items: InfoItem[]
}

defineProps<Props>()
</script>

<style scoped>
.ui-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg, 1rem);
}

.ui-info-grid__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md, 0.75rem);
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--border-radius-md, 0.5rem);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.ui-info-grid__label {
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-gray-600, #495057);
}

.ui-info-grid__value {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-gray-800, #212529);
}

/* Responsive */
@media (max-width: 768px) {
  .ui-info-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md, 0.75rem);
  }
}
</style>