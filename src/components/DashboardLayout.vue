<template>
  <div class="dashboard-layout">
    <!-- Left Sidebar Navigation -->
    <aside class="dashboard-sidebar">
      <div class="sidebar-header">
        <h1 class="logo">AI Board</h1>
        <p class="tagline">Multi-Agent Project Management</p>
      </div>
      
      <nav class="sidebar-nav">
        <button
          v-for="section in sections"
          :key="section.key"
          :class="[
            'nav-section',
            { 'nav-section--active': currentSection === section.key }
          ]"
          @click="selectSection(section.key)"
        >
          <span class="nav-icon">{{ section.icon }}</span>
          <span class="nav-label">{{ section.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="dashboard-main">
      <!-- Sub-navigation tabs -->
      <div class="main-header">
        <UITabs
          v-if="currentSectionData?.tabs"
          v-model="currentTab"
          :tabs="currentSectionData.tabs"
          class="section-tabs"
        />
      </div>
      
      <!-- Content -->
      <div class="main-content">
        <router-view />
      </div>
    </main>

    <!-- Right Sidebar - AI Assistant -->
    <aside class="dashboard-ai-sidebar">
      <UICard variant="elevated" class="ai-panel">
        <template #header>
          <div class="ai-header">
            <span class="ai-icon">🤖</span>
            <h3>AI Assistant</h3>
          </div>
        </template>
        
        <div class="ai-content">
          <p class="ai-status">Ready to help</p>
          <div class="ai-suggestions">
            <h4>Quick Actions</h4>
            <button class="ai-suggestion">Create new project</button>
            <button class="ai-suggestion">Analyze project status</button>
            <button class="ai-suggestion">Optimize workflows</button>
          </div>
        </div>
      </UICard>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { UITabs, UICard } from '@/ui'

interface SectionTab {
  value: string
  label: string
  icon?: string
  route: string
}

interface Section {
  key: string
  label: string
  icon: string
  tabs?: SectionTab[]
}

const router = useRouter()
const route = useRoute()

const sections: Section[] = [
  {
    key: 'projects',
    label: 'Projects',
    icon: '🏠',
    tabs: [
      { value: 'overview', label: 'Overview', icon: '📊', route: '/' },
      { value: 'active', label: 'Active', route: '/projects/active' },
      { value: 'templates', label: 'Templates', route: '/projects/templates' }
    ]
  },
  {
    key: 'agents',
    label: 'Agents',
    icon: '🤖',
    tabs: [
      { value: 'manager', label: 'Manager', icon: '⚙️', route: '/agents' },
      { value: 'performance', label: 'Performance', route: '/agents/performance' },
      { value: 'training', label: 'Training', route: '/agents/training' }
    ]
  },
  {
    key: 'orchestration',
    label: 'Business',
    icon: '🎯',
    tabs: [
      { value: 'center', label: 'Center', icon: '🏢', route: '/orchestration' },
      { value: 'workflows', label: 'Workflows', route: '/orchestration/workflows' },
      { value: 'automation', label: 'Automation', route: '/orchestration/automation' }
    ]
  },
  {
    key: 'integrations',
    label: 'Integrations',
    icon: '🔌',
    tabs: [
      { value: 'mcp', label: 'MCP', icon: '🔗', route: '/mcp' },
      { value: 'apis', label: 'APIs', route: '/mcp/apis' },
      { value: 'webhooks', label: 'Webhooks', route: '/mcp/webhooks' }
    ]
  }
]

// Determine current section based on route
const currentSection = ref(getCurrentSectionFromRoute())
const currentTab = ref(getCurrentTabFromRoute())

function getCurrentSectionFromRoute(): string {
  const path = route.path
  if (path.startsWith('/agents')) return 'agents'
  if (path.startsWith('/orchestration')) return 'orchestration'
  if (path.startsWith('/mcp')) return 'integrations'
  return 'projects'
}

function getCurrentTabFromRoute(): string {
  const path = route.path
  for (const section of sections) {
    if (section.tabs) {
      for (const tab of section.tabs) {
        if (tab.route === path) return tab.value
      }
    }
  }
  return sections.find(s => s.key === currentSection.value)?.tabs?.[0]?.value || ''
}

const currentSectionData = computed(() => 
  sections.find(section => section.key === currentSection.value)
)

function selectSection(sectionKey: string) {
  currentSection.value = sectionKey
  const section = sections.find(s => s.key === sectionKey)
  if (section?.tabs?.length) {
    const firstTab = section.tabs[0]
    currentTab.value = firstTab.value
    router.push(firstTab.route)
  }
}

// Watch for tab changes and navigate
function onTabChange(tabValue: string) {
  const section = currentSectionData.value
  const tab = section?.tabs?.find(t => t.value === tabValue)
  if (tab) {
    router.push(tab.route)
  }
}

// Watch tab changes
import { watch } from 'vue'
watch(currentTab, onTabChange)

// Update current section when route changes
watch(() => route.path, () => {
  currentSection.value = getCurrentSectionFromRoute()
  currentTab.value = getCurrentTabFromRoute()
})
</script>

<style scoped>
.dashboard-layout {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  grid-template-rows: 100vh;
  background: linear-gradient(135deg, var(--color-primary, #667eea) 0%, var(--color-secondary, #764ba2) 100%);
  gap: 0;
}

/* Left Sidebar */
.dashboard-sidebar {
  background: var(--color-backdrop-blur, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
}

.sidebar-header {
  padding: var(--spacing-2xl, 2rem);
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  margin: 0;
  font-size: var(--font-size-2xl, 1.5rem);
  color: var(--color-white, #ffffff);
  font-weight: var(--font-weight-bold, 700);
}

.tagline {
  margin: var(--spacing-sm, 0.5rem) 0 0 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-sm, 0.875rem);
}

.sidebar-nav {
  padding: var(--spacing-xl, 1.25rem);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 0.75rem);
}

.nav-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 1rem);
  padding: var(--spacing-lg, 1rem);
  background: none;
  border: none;
  border-radius: var(--border-radius-lg, 0.75rem);
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
}

.nav-section:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-white, #ffffff);
  transform: translateX(4px);
}

.nav-section--active {
  background: rgba(255, 255, 255, 0.15);
  color: var(--color-white, #ffffff);
  box-shadow: var(--shadow-md, 0 4px 15px rgba(0, 0, 0, 0.1));
}

.nav-icon {
  font-size: var(--font-size-xl, 1.125rem);
  flex-shrink: 0;
}

/* Main Content */
.dashboard-main {
  display: flex;
  flex-direction: column;
  background: var(--color-white, #ffffff);
  overflow: hidden;
}

.main-header {
  background: var(--color-white, #ffffff);
  border-bottom: 1px solid var(--color-gray-100, #e9ecef);
  padding: 0 var(--spacing-2xl, 2rem);
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-2xl, 2rem);
}

/* Right AI Sidebar */
.dashboard-ai-sidebar {
  background: var(--color-backdrop-blur, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: var(--spacing-xl, 1.25rem);
  overflow-y: auto;
}

.ai-panel {
  height: fit-content;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 0.75rem);
}

.ai-header h3 {
  margin: 0;
  color: var(--color-gray-800, #212529);
}

.ai-icon {
  font-size: var(--font-size-xl, 1.125rem);
}

.ai-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1rem);
}

.ai-status {
  margin: 0;
  color: var(--color-gray-600, #495057);
  font-style: italic;
}

.ai-suggestions h4 {
  margin: 0 0 var(--spacing-md, 0.75rem) 0;
  color: var(--color-gray-700, #495057);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
}

.ai-suggestion {
  display: block;
  width: 100%;
  padding: var(--spacing-md, 0.75rem);
  margin-bottom: var(--spacing-sm, 0.5rem);
  background: var(--color-gray-50, #f8f9fa);
  border: 1px solid var(--color-gray-200, #dee2e6);
  border-radius: var(--border-radius-md, 0.5rem);
  color: var(--color-gray-700, #495057);
  font-size: var(--font-size-sm, 0.875rem);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-suggestion:hover {
  background: var(--color-primary, #667eea);
  color: var(--color-white, #ffffff);
  border-color: var(--color-primary, #667eea);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .dashboard-layout {
    grid-template-columns: 240px 1fr 280px;
  }
}

@media (max-width: 1024px) {
  .dashboard-layout {
    grid-template-columns: 200px 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .dashboard-ai-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .dashboard-sidebar {
    position: static;
    height: auto;
    overflow: visible;
  }
  
  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: var(--spacing-lg, 1rem);
  }
  
  .nav-section {
    flex-shrink: 0;
    min-width: fit-content;
  }
  
  .dashboard-ai-sidebar {
    display: none;
  }
}
</style>