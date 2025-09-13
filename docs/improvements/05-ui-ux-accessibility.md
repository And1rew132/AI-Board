# Issue: Improve UI/UX and Accessibility

## Priority: Medium

## Description
The current UI could benefit from better user experience design, accessibility improvements, and a more polished visual appearance. Adding proper responsive design, accessibility features, and UI enhancements will make the application more user-friendly and inclusive.

## Current UI/UX Issues
- Basic styling without design system
- Limited accessibility features
- No responsive design considerations
- Inconsistent component styling
- No loading states or error handling in UI
- No keyboard navigation support
- Missing proper ARIA labels
- No dark mode support

## Proposed Solution

### 1. Design System and Component Library

Create `src/styles/design-system.css`:
```css
/* Design System Variables */
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-primary-light: #93c5fd;
  
  --color-secondary: #6366f1;
  --color-accent: #f59e0b;
  
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Neutral colors */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Typography */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Spacing */
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  --spacing-20: 5rem;
  
  /* Border radius */
  --radius-sm: 0.125rem;
  --radius-base: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
  
  /* Z-index */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}

/* Dark mode variables */
[data-theme="dark"] {
  --color-bg: var(--color-gray-900);
  --color-bg-secondary: var(--color-gray-800);
  --color-text: var(--color-gray-100);
  --color-text-secondary: var(--color-gray-300);
  --color-border: var(--color-gray-700);
}

/* Light mode variables */
[data-theme="light"] {
  --color-bg: white;
  --color-bg-secondary: var(--color-gray-50);
  --color-text: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-border: var(--color-gray-200);
}

/* Base styles */
body {
  font-family: var(--font-family-sans);
  background-color: var(--color-bg);
  color: var(--color-text);
  transition: background-color var(--transition-base), color var(--transition-base);
}

/* Utility classes */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Component utilities */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  
  &:focus-visible {
    @extend .focus-visible;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-dark);
  }
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-text);
  border-color: var(--color-border);
  
  &:hover:not(:disabled) {
    background-color: var(--color-bg-secondary);
  }
}

.card {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-6);
  transition: box-shadow var(--transition-base);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
}

.input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-secondary);
  }
}
```

### 2. Accessible Components

Create `src/components/ui/Button.vue`:
```vue
<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :disabled="disabled"
    :aria-disabled="disabled"
    :aria-describedby="ariaDescribedby"
    class="btn"
    :class="[
      `btn-${variant}`,
      `btn-${size}`,
      {
        'btn-loading': loading,
        'btn-icon-only': iconOnly
      }
    ]"
    @click="handleClick"
  >
    <Icon v-if="loading" name="spinner" class="btn-spinner" aria-hidden="true" />
    <Icon v-else-if="icon" :name="icon" aria-hidden="true" />
    
    <span v-if="!iconOnly" class="btn-text">
      <slot />
    </span>
    
    <span v-if="iconOnly" class="sr-only">
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  tag?: 'button' | 'a' | 'router-link'
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconOnly?: boolean
  ariaDescribedby?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  tag: 'button',
  disabled: false,
  loading: false,
  iconOnly: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

function handleClick(event: Event) {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<style scoped>
.btn-sm {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-xs);
}

.btn-lg {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-base);
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}

.btn-ghost:hover:not(:disabled) {
  color: var(--color-text);
  background-color: var(--color-bg-secondary);
}

.btn-loading {
  cursor: wait;
}

.btn-spinner {
  animation: spin 1s linear infinite;
  margin-right: var(--spacing-2);
}

.btn-icon-only {
  padding: var(--spacing-2);
  width: 2.5rem;
  height: 2.5rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
```

Create `src/components/ui/Modal.vue`:
```vue
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="modal-backdrop"
        role="dialog"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        aria-modal="true"
        @click="handleBackdropClick"
        @keydown.esc="handleEscape"
      >
        <div
          ref="modalContent"
          class="modal-content"
          :class="`modal-${size}`"
          @click.stop
        >
          <header v-if="title || $slots.header" class="modal-header">
            <h2 :id="titleId" class="modal-title">
              <slot name="header">{{ title }}</slot>
            </h2>
            <Button
              variant="ghost"
              icon-only
              icon="x"
              :aria-label="closeLabel"
              @click="handleClose"
            >
              Close
            </Button>
          </header>
          
          <div :id="descriptionId" class="modal-body">
            <slot />
          </div>
          
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import Button from './Button.vue'

interface Props {
  show: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  closeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnBackdrop: true,
  closeOnEscape: true,
  closeLabel: 'Close modal'
})

const emit = defineEmits<{
  close: []
  opened: []
  closed: []
}>()

const modalContent = ref<HTMLElement>()
const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`
const descriptionId = `modal-description-${Math.random().toString(36).substr(2, 9)}`

let previouslyFocusedElement: HTMLElement | null = null

function handleClose() {
  emit('close')
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    handleClose()
  }
}

function handleEscape() {
  if (props.closeOnEscape) {
    handleClose()
  }
}

function trapFocus(event: KeyboardEvent) {
  if (!modalContent.value || event.key !== 'Tab') return

  const focusableElements = modalContent.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

watch(() => props.show, async (newValue) => {
  if (newValue) {
    previouslyFocusedElement = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    
    await nextTick()
    const firstFocusable = modalContent.value?.querySelector(
      'button, [href], input, select, textarea'
    ) as HTMLElement
    firstFocusable?.focus()
    
    emit('opened')
  } else {
    document.body.style.overflow = ''
    previouslyFocusedElement?.focus()
    emit('closed')
  }
})

onMounted(() => {
  document.addEventListener('keydown', trapFocus)
})

onUnmounted(() => {
  document.removeEventListener('keydown', trapFocus)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-4);
}

.modal-content {
  background-color: var(--color-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
}

.modal-sm { max-width: 400px; }
.modal-md { max-width: 500px; }
.modal-lg { max-width: 700px; }
.modal-xl { max-width: 900px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-footer {
  padding: var(--spacing-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-base);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform var(--transition-base);
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
```

### 3. Dark Mode Implementation

Create `src/composables/useTheme.ts`:
```typescript
import { ref, watch, onMounted } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const theme = ref<Theme>('system')
const isDark = ref(false)

export function useTheme() {
  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    updateDocumentTheme()
  }

  function updateDocumentTheme() {
    const root = document.documentElement
    
    if (theme.value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      isDark.value = theme.value === 'dark'
      root.setAttribute('data-theme', theme.value)
    }
  }

  function toggleTheme() {
    const newTheme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Initialize theme
  onMounted(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      theme.value = savedTheme
    }
    
    updateDocumentTheme()
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateDocumentTheme)
  })

  watch(theme, updateDocumentTheme)

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme
  }
}
```

### 4. Responsive Layout Components

Create `src/components/ui/Layout.vue`:
```vue
<template>
  <div class="layout">
    <aside 
      class="sidebar"
      :class="{ 'sidebar-open': sidebarOpen }"
      role="navigation"
      aria-label="Main navigation"
    >
      <div class="sidebar-header">
        <h1 class="sidebar-title">
          <Icon name="brain" aria-hidden="true" />
          AI Board
        </h1>
        <Button
          v-if="isMobile"
          variant="ghost"
          icon-only
          icon="x"
          aria-label="Close navigation"
          @click="closeSidebar"
        >
          Close
        </Button>
      </div>
      
      <nav class="sidebar-nav">
        <slot name="sidebar" />
      </nav>
    </aside>
    
    <div class="main-content">
      <header class="header">
        <Button
          v-if="isMobile"
          variant="ghost"
          icon-only
          icon="menu"
          aria-label="Open navigation"
          @click="openSidebar"
        >
          Menu
        </Button>
        
        <div class="header-actions">
          <slot name="header" />
          
          <Button
            variant="ghost"
            icon-only
            :icon="isDark ? 'sun' : 'moon'"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            Toggle theme
          </Button>
        </div>
      </header>
      
      <main class="content" role="main">
        <slot />
      </main>
    </div>
    
    <!-- Backdrop for mobile -->
    <div
      v-if="isMobile && sidebarOpen"
      class="backdrop"
      @click="closeSidebar"
      @keydown.esc="closeSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import Button from './Button.vue'

const { isDark, toggleTheme } = useTheme()

const sidebarOpen = ref(false)
const isMobile = ref(false)

function openSidebar() {
  sidebarOpen.value = true
}

function closeSidebar() {
  sidebarOpen.value = false
}

function handleResize() {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    sidebarOpen.value = false
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg);
}

.sidebar {
  width: 16rem;
  background-color: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-base);
}

@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: var(--z-fixed);
    transform: translateX(-100%);
  }
  
  .sidebar-open {
    transform: translateX(0);
  }
}

.sidebar-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin: 0;
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-4);
  overflow-y: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header {
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.content {
  flex: 1;
  padding: var(--spacing-6);
  overflow-y: auto;
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
}

@media (max-width: 1023px) {
  .content {
    padding: var(--spacing-4);
  }
}
</style>
```

### 5. Loading and Error States

Create `src/components/ui/LoadingSpinner.vue`:
```vue
<template>
  <div class="loading-container" :class="{ 'loading-overlay': overlay }">
    <div
      class="spinner"
      :class="`spinner-${size}`"
      role="status"
      :aria-label="ariaLabel"
    >
      <span class="sr-only">{{ ariaLabel }}</span>
    </div>
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  overlay?: boolean
  message?: string
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  overlay: false,
  ariaLabel: 'Loading'
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: var(--z-modal-backdrop);
}

[data-theme="dark"] .loading-overlay {
  background-color: rgba(0, 0, 0, 0.8);
}

.spinner {
  border: 2px solid var(--color-gray-200);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-sm {
  width: 1rem;
  height: 1rem;
}

.spinner-md {
  width: 2rem;
  height: 2rem;
}

.spinner-lg {
  width: 3rem;
  height: 3rem;
}

.loading-message {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

## Benefits
- Improved user experience and visual appeal
- Better accessibility for users with disabilities
- Responsive design for all devices
- Consistent design system
- Dark mode support
- Better keyboard navigation
- Screen reader support
- Loading states and error handling

## Accessibility Features
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast support
- Reduced motion support
- Semantic HTML structure

## Acceptance Criteria
- [ ] Design system implemented with CSS variables
- [ ] Accessible Button component created
- [ ] Modal component with focus trapping
- [ ] Dark mode implementation
- [ ] Responsive layout component
- [ ] Loading spinner component
- [ ] All components tested with screen readers
- [ ] Keyboard navigation working throughout app
- [ ] Color contrast meets WCAG AA standards
- [ ] Components documented with examples

## Estimated Effort
Large (14-18 hours)