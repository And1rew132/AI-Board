<template>
  <div class="ui-card" :class="[variant && `ui-card--${variant}`]">
    <header v-if="$slots.header" class="ui-card__header">
      <slot name="header" />
    </header>
    
    <div class="ui-card__content">
      <slot />
    </div>
    
    <footer v-if="$slots.footer" class="ui-card__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'elevated' | 'outlined'
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
})
</script>

<style scoped>
.ui-card {
  background: var(--color-white, #ffffff);
  border-radius: var(--border-radius-lg, 0.75rem);
  overflow: hidden;
  transition: all 0.3s ease;
}

.ui-card--default {
  box-shadow: var(--shadow-base, 0 4px 15px rgba(0, 0, 0, 0.05));
}

.ui-card--elevated {
  box-shadow: var(--shadow-lg, 0 8px 25px rgba(0, 0, 0, 0.1));
}

.ui-card--elevated:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl, 0 10px 40px rgba(0, 0, 0, 0.1));
}

.ui-card--outlined {
  border: 1px solid var(--color-gray-200, #dee2e6);
  box-shadow: none;
}

.ui-card__header {
  padding: var(--spacing-xl, 1.25rem) var(--spacing-xl, 1.25rem) 0;
  border-bottom: 1px solid var(--color-gray-100, #e9ecef);
  margin-bottom: var(--spacing-lg, 1rem);
}

.ui-card__content {
  padding: var(--spacing-xl, 1.25rem);
}

.ui-card__footer {
  padding: 0 var(--spacing-xl, 1.25rem) var(--spacing-xl, 1.25rem);
  border-top: 1px solid var(--color-gray-100, #e9ecef);
  margin-top: var(--spacing-lg, 1rem);
}

/* Remove padding from content if header/footer exist */
.ui-card__header + .ui-card__content {
  padding-top: 0;
}

.ui-card__content + .ui-card__footer {
  padding-top: var(--spacing-lg, 1rem);
}
</style>