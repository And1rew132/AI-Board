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
            <UIBadge class="ai-status-badge">Online</UIBadge>
          </div>
        </template>
        
        <div class="ai-content">
          <p class="ai-status">Ready to help with your {{ currentSectionLabel.toLowerCase() }}</p>
          
          <div class="ai-suggestions">
            <h4>Quick Actions</h4>
            <button 
              v-for="action in contextualActions" 
              :key="action.text"
              class="ai-suggestion"
              @click="handleAIAction(action)"
            >
              <span class="action-icon">{{ action.icon }}</span>
              {{ action.text }}
            </button>
          </div>

          <div class="ai-insights" v-if="currentSection !== 'projects' || hasProjects">
            <h4>Insights</h4>
            <div class="insight-item">
              <span class="insight-icon">📊</span>
              <span class="insight-text">{{ currentInsight }}</span>
            </div>
          </div>

          <div class="ai-chat-prompt">
            <h4>Ask AI</h4>
            <div class="chat-input-group">
              <input 
                type="text" 
                placeholder="Type your question..."
                class="chat-input"
                v-model="chatInput"
                @keyup.enter="handleChatSubmit"
              />
              <button class="chat-submit" @click="handleChatSubmit" :disabled="!chatInput.trim()">
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </UICard>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { UITabs, UICard, UIBadge } from '@/ui'

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
const chatInput = ref('')
const hasProjects = ref(false) // This would be connected to your project store

const currentSectionLabel = computed(() => {
  const section = sections.find(s => s.key === currentSection.value)
  return section?.label || 'Projects'
})

const contextualActions = computed(() => {
  const baseActions = {
    projects: [
      { icon: '➕', text: 'Create new project', action: 'create_project' },
      { icon: '📊', text: 'Analyze project status', action: 'analyze_projects' },
      { icon: '📋', text: 'Generate project report', action: 'project_report' }
    ],
    agents: [
      { icon: '🤖', text: 'Create new agent', action: 'create_agent' },
      { icon: '⚡', text: 'Optimize agent performance', action: 'optimize_agents' },
      { icon: '🔄', text: 'Restart failed agents', action: 'restart_agents' }
    ],
    orchestration: [
      { icon: '🔄', text: 'Create workflow', action: 'create_workflow' },
      { icon: '📈', text: 'Analyze performance', action: 'analyze_performance' },
      { icon: '🎯', text: 'Optimize processes', action: 'optimize_processes' }
    ],
    integrations: [
      { icon: '🔗', text: 'Add integration', action: 'add_integration' },
      { icon: '🔍', text: 'Test connections', action: 'test_connections' },
      { icon: '⚙️', text: 'Configure endpoints', action: 'configure_endpoints' }
    ]
  }
  return baseActions[currentSection.value as keyof typeof baseActions] || baseActions.projects
})

const currentInsight = computed(() => {
  const insights = {
    projects: 'Your projects are running smoothly. Consider adding automation.',
    agents: 'Agent performance is optimal. 3 agents are currently active.',
    orchestration: 'Workflow efficiency increased by 15% this week.',
    integrations: 'All integrations are healthy. Consider adding webhooks.'
  }
  return insights[currentSection.value as keyof typeof insights] || insights.projects
})

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

function handleAIAction(action: { icon: string; text: string; action: string }) {
  // This would integrate with your actual AI system
  console.log('AI Action:', action.action)
  // You could dispatch to stores, call APIs, etc.
}

function handleChatSubmit() {
  if (chatInput.value.trim()) {
    console.log('AI Chat:', chatInput.value)
    // This would integrate with your actual AI chat system
    chatInput.value = ''
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
  justify-content: space-between;
}

.ai-header h3 {
  margin: 0;
  color: var(--color-gray-800, #212529);
  flex: 1;
}

.ai-status-badge {
  font-size: var(--font-size-xs, 0.75rem);
}

.ai-icon {
  font-size: var(--font-size-xl, 1.125rem);
}

.ai-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl, 1.25rem);
}

.ai-status {
  margin: 0;
  color: var(--color-gray-600, #495057);
  font-style: italic;
  font-size: var(--font-size-sm, 0.875rem);
}

.ai-suggestions h4,
.ai-insights h4,
.ai-chat-prompt h4 {
  margin: 0 0 var(--spacing-md, 0.75rem) 0;
  color: var(--color-gray-700, #495057);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
}

.ai-suggestion {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
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
  text-align: left;
}

.ai-suggestion:hover {
  background: var(--color-primary, #667eea);
  color: var(--color-white, #ffffff);
  border-color: var(--color-primary, #667eea);
  transform: translateY(-1px);
}

.action-icon {
  font-size: var(--font-size-base, 1rem);
  flex-shrink: 0;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-md, 0.75rem);
  background: rgba(102, 126, 234, 0.05);
  border-radius: var(--border-radius-md, 0.5rem);
  border-left: 3px solid var(--color-primary, #667eea);
}

.insight-icon {
  font-size: var(--font-size-base, 1rem);
  flex-shrink: 0;
}

.insight-text {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-gray-700, #495057);
  line-height: var(--line-height-normal, 1.5);
}

.chat-input-group {
  display: flex;
  gap: var(--spacing-sm, 0.5rem);
}

.chat-input {
  flex: 1;
  padding: var(--spacing-md, 0.75rem);
  border: 1px solid var(--color-gray-200, #dee2e6);
  border-radius: var(--border-radius-md, 0.5rem);
  font-size: var(--font-size-sm, 0.875rem);
  background: var(--color-white, #ffffff);
  transition: border-color 0.2s ease;
}

.chat-input:focus {
  outline: none;
  border-color: var(--color-primary, #667eea);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-submit {
  padding: var(--spacing-md, 0.75rem);
  background: var(--color-primary, #667eea);
  color: var(--color-white, #ffffff);
  border: none;
  border-radius: var(--border-radius-md, 0.5rem);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.chat-submit:hover:not(:disabled) {
  background: var(--color-primary-dark, #5a67d8);
  transform: translateY(-1px);
}

.chat-submit:disabled {
  background: var(--color-gray-300, #ced4da);
  cursor: not-allowed;
  transform: none;
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