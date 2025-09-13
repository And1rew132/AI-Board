<template>
  <div class="dashboard-layout">
    <!-- Skip Links for accessibility -->
    <div class="skip-links">
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#sidebar-nav" class="skip-link">Skip to navigation</a>
    </div>

    <!-- Left Sidebar Navigation -->
    <aside class="dashboard-sidebar" role="navigation" aria-label="Main navigation">
      <div class="sidebar-header">
        <h1 class="logo">AI Board</h1>
        <p class="tagline">Multi-Agent Project Management</p>
      </div>
      
      <nav id="sidebar-nav" class="sidebar-nav" role="menubar" aria-label="Main sections">
        <button
          v-for="(section, index) in sections"
          :key="section.key"
          :class="[
            'nav-section',
            { 'nav-section--active': currentSection === section.key }
          ]"
          @click="selectSection(section.key)"
          @keydown="handleNavKeydown($event, index)"
          role="menuitem"
          :aria-current="currentSection === section.key ? 'page' : false"
          :aria-label="`Navigate to ${section.label} section`"
          :tabindex="currentSection === section.key ? 0 : -1"
        >
          <span class="nav-icon" aria-hidden="true">{{ section.icon }}</span>
          <span class="nav-label">{{ section.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="dashboard-main" role="main">
      <!-- Sub-navigation tabs -->
      <div class="main-header" v-if="currentSectionData?.tabs">
        <nav class="section-tabs-nav" role="tablist" :aria-label="`${currentSectionLabel} navigation`">
          <button
            v-for="(tab, index) in currentSectionData.tabs"
            :key="tab.value"
            :class="[
              'section-tab',
              { 'section-tab--active': currentTab === tab.value }
            ]"
            @click="selectTab(tab.value)"
            @keydown="handleTabKeydown($event, index)"
            role="tab"
            :aria-selected="currentTab === tab.value"
            :aria-controls="`tab-panel-${tab.value}`"
            :tabindex="currentTab === tab.value ? 0 : -1"
            :aria-label="`${tab.label} tab`"
          >
            <span v-if="tab.icon" class="tab-icon" aria-hidden="true">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </nav>
      </div>
      
      <!-- Content -->
      <div 
        class="main-content"
        role="tabpanel"
        :aria-labelledby="currentTab ? `tab-${currentTab}` : undefined"
        :id="currentTab ? `tab-panel-${currentTab}` : 'main-content'"
      >
        <router-view />
      </div>
    </main>

    <!-- Right Sidebar - AI Assistant -->
    <aside class="dashboard-ai-sidebar" role="complementary" aria-label="AI Assistant">
      <UICard variant="elevated" class="ai-panel">
        <template #header>
          <div class="ai-header">
            <span class="ai-icon" aria-hidden="true">🤖</span>
            <h3>AI Assistant</h3>
            <UIBadge class="ai-status-badge" aria-label="AI Assistant is online">Online</UIBadge>
          </div>
        </template>
        
        <div class="ai-content">
          <p class="ai-status">Ready to help with your {{ currentSectionLabel.toLowerCase() }}</p>
          
          <div class="ai-suggestions">
            <h4>Quick Actions</h4>
            <div class="suggestions-list" role="list">
              <button 
                v-for="action in contextualActions" 
                :key="action.text"
                class="ai-suggestion"
                @click="handleAIAction(action)"
                role="listitem"
                :aria-label="action.text"
              >
                <span class="action-icon" aria-hidden="true">{{ action.icon }}</span>
                {{ action.text }}
              </button>
            </div>
          </div>

          <div class="ai-insights" v-if="currentSection !== 'projects' || hasProjects">
            <h4>Insights</h4>
            <div class="insight-item" role="status" aria-live="polite">
              <span class="insight-icon" aria-hidden="true">📊</span>
              <span class="insight-text">{{ currentInsight }}</span>
            </div>
          </div>

          <div class="ai-chat-prompt">
            <h4>Ask AI</h4>
            <form @submit.prevent="handleChatSubmit" class="chat-form">
              <label for="chat-input" class="sr-only">Ask AI a question</label>
              <div class="chat-input-group">
                <input 
                  id="chat-input"
                  type="text" 
                  placeholder="Type your question..."
                  class="chat-input"
                  v-model="chatInput"
                  :aria-describedby="chatInput.trim() ? undefined : 'chat-help'"
                />
                <button 
                  type="submit"
                  class="chat-submit" 
                  :disabled="!chatInput.trim()"
                  :aria-label="chatInput.trim() ? 'Send message' : 'Enter a message to send'"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
              <div id="chat-help" class="chat-help sr-only">Enter your question and press Enter or click send</div>
            </form>
          </div>
        </div>
      </UICard>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { UICard, UIBadge } from '@/ui'

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
      { value: 'active', label: 'Active', route: '/projects' },
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

function selectTab(tabValue: string) {
  currentTab.value = tabValue
  onTabChange(tabValue)
}

// Watch for tab changes and navigate
function onTabChange(tabValue: string) {
  const section = currentSectionData.value
  const tab = section?.tabs?.find(t => t.value === tabValue)
  if (tab) {
    router.push(tab.route)
  }
}

// Keyboard navigation handlers
function handleNavKeydown(event: KeyboardEvent, index: number) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusNavButton((index + 1) % sections.length)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusNavButton(index === 0 ? sections.length - 1 : index - 1)
      break
    case 'Home':
      event.preventDefault()
      focusNavButton(0)
      break
    case 'End':
      event.preventDefault()
      focusNavButton(sections.length - 1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectSection(sections[index].key)
      break
  }
}

function handleTabKeydown(event: KeyboardEvent, index: number) {
  const tabs = currentSectionData.value?.tabs || []
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      focusTabButton(index === 0 ? tabs.length - 1 : index - 1)
      break
    case 'ArrowRight':
      event.preventDefault()
      focusTabButton((index + 1) % tabs.length)
      break
    case 'Home':
      event.preventDefault()
      focusTabButton(0)
      break
    case 'End':
      event.preventDefault()
      focusTabButton(tabs.length - 1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectTab(tabs[index].value)
      break
  }
}

function focusNavButton(index: number) {
  const buttons = document.querySelectorAll('.nav-section')
  const targetButton = buttons[index] as HTMLElement
  if (targetButton) {
    // Update tabindex for all buttons
    buttons.forEach((btn, i) => {
      btn.setAttribute('tabindex', i === index ? '0' : '-1')
    })
    targetButton.focus()
  }
}

function focusTabButton(index: number) {
  const buttons = document.querySelectorAll('.section-tab')
  const targetButton = buttons[index] as HTMLElement
  if (targetButton) {
    // Update tabindex for all buttons
    buttons.forEach((btn, i) => {
      btn.setAttribute('tabindex', i === index ? '0' : '-1')
    })
    targetButton.focus()
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
  position: relative;
}

/* Skip Links for accessibility */
.skip-links {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 1000;
}

.skip-link {
  position: absolute;
  background: #000;
  color: #fff;
  padding: 0.5rem 1rem;
  text-decoration: none;
  border-radius: 0 0 0.25rem 0;
  font-weight: 600;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 0;
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
  position: relative;
}

.nav-section:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-white, #ffffff);
  transform: translateX(4px);
}

.nav-section:focus {
  outline: 3px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

.nav-section--active {
  background: rgba(255, 255, 255, 0.15);
  color: var(--color-white, #ffffff);
  box-shadow: var(--shadow-md, 0 4px 15px rgba(0, 0, 0, 0.1));
}

.nav-section--active::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--color-white, #ffffff);
  border-radius: 2px 0 0 2px;
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

.section-tabs-nav {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-gray-200, #dee2e6);
}

.section-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-lg, 1rem) var(--spacing-xl, 1.25rem);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--color-gray-600, #6c757d);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.section-tab:hover {
  color: var(--color-primary, #667eea);
  background: var(--color-gray-50, #f8f9fa);
}

.section-tab:focus {
  outline: 3px solid rgba(102, 126, 234, 0.3);
  outline-offset: 2px;
}

.section-tab--active {
  color: var(--color-primary, #667eea);
  border-bottom-color: var(--color-primary, #667eea);
  background: var(--color-white, #ffffff);
}

.tab-icon {
  font-size: var(--font-size-base, 1rem);
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

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
}

.ai-suggestion {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  width: 100%;
  padding: var(--spacing-md, 0.75rem);
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

.ai-suggestion:focus {
  outline: 3px solid rgba(102, 126, 234, 0.3);
  outline-offset: 2px;
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

.chat-form {
  display: contents;
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

.chat-submit:focus {
  outline: 3px solid rgba(102, 126, 234, 0.3);
  outline-offset: 2px;
}

.chat-submit:disabled {
  background: var(--color-gray-300, #ced4da);
  cursor: not-allowed;
  transform: none;
}

.chat-help {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-gray-500, #6c757d);
  margin-top: var(--spacing-xs, 0.25rem);
}

/* Screen Reader Only */
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
  
  .nav-section--active::after {
    display: none;
  }
  
  .dashboard-ai-sidebar {
    display: none;
  }
  
  .main-header {
    padding: 0 var(--spacing-lg, 1rem);
  }
  
  .main-content {
    padding: var(--spacing-lg, 1rem);
  }
  
  .section-tabs-nav {
    overflow-x: auto;
  }
  
  .section-tab {
    flex-shrink: 0;
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .sidebar-header {
    padding: var(--spacing-lg, 1rem);
  }
  
  .logo {
    font-size: var(--font-size-lg, 1.125rem);
  }
  
  .nav-section {
    padding: var(--spacing-md, 0.75rem);
    gap: var(--spacing-sm, 0.5rem);
  }
  
  .section-tab {
    padding: var(--spacing-md, 0.75rem);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .nav-section:focus,
  .section-tab:focus,
  .ai-suggestion:focus,
  .chat-input:focus,
  .chat-submit:focus {
    outline: 3px solid;
    outline-offset: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .nav-section,
  .section-tab,
  .ai-suggestion,
  .chat-submit {
    transition: none;
  }
  
  .nav-section:hover,
  .ai-suggestion:hover,
  .chat-submit:hover:not(:disabled) {
    transform: none;
  }
}
</style>