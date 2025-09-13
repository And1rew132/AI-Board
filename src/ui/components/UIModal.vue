<template>
  <Teleport to="body">
    <div v-if="modelValue" class="ui-modal-overlay" @click="handleOverlayClick">
      <div 
        :class="[
          'ui-modal',
          `ui-modal--${size}`
        ]"
        @click.stop
      >
        <header v-if="$slots.header || title" class="ui-modal__header">
          <div class="ui-modal__title">
            <slot name="header">
              <h3>{{ title }}</h3>
            </slot>
          </div>
          <button 
            v-if="closable"
            @click="close"
            class="ui-modal__close"
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        
        <div class="ui-modal__content">
          <slot />
        </div>
        
        <footer v-if="$slots.footer" class="ui-modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnOverlay: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    close()
  }
}

// Prevent body scroll when modal is open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.ui-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay, rgba(0, 0, 0, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg, 1rem);
}

.ui-modal {
  background: var(--color-white, #ffffff);
  border-radius: var(--border-radius-xl, 1rem);
  box-shadow: var(--shadow-xl, 0 10px 40px rgba(0, 0, 0, 0.1));
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
}

.ui-modal--sm {
  max-width: 400px;
}

.ui-modal--md {
  max-width: 500px;
}

.ui-modal--lg {
  max-width: 700px;
}

.ui-modal--xl {
  max-width: 900px;
}

.ui-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xl, 1.25rem);
  border-bottom: 1px solid var(--color-gray-100, #e9ecef);
}

.ui-modal__title h3 {
  margin: 0;
  color: var(--color-gray-800, #212529);
  font-size: var(--font-size-xl, 1.25rem);
  font-weight: var(--font-weight-semibold, 600);
}

.ui-modal__close {
  background: none;
  border: none;
  font-size: var(--font-size-lg, 1.125rem);
  color: var(--color-gray-500, #6c757d);
  cursor: pointer;
  padding: var(--spacing-sm, 0.5rem);
  border-radius: var(--border-radius-sm, 0.25rem);
  transition: all 0.2s ease;
}

.ui-modal__close:hover {
  background: var(--color-gray-100, #e9ecef);
  color: var(--color-gray-700, #343a40);
}

.ui-modal__content {
  padding: var(--spacing-xl, 1.25rem);
}

.ui-modal__footer {
  padding: var(--spacing-xl, 1.25rem);
  border-top: 1px solid var(--color-gray-100, #e9ecef);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md, 0.75rem);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>