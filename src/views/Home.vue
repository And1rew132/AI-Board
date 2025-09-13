<template>
  <div class="home-content">
    <!-- Welcome Section -->
    <section class="welcome-section" v-if="shouldShowWelcome">
      <UICard variant="elevated" class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-header">
            <h1 class="welcome-title">
              <span class="welcome-icon">🚀</span>
              Welcome to AI Board
            </h1>
            <p class="welcome-subtitle">
              Your intelligent multi-agent project management platform
            </p>
          </div>
          
          <div class="welcome-features">
            <div class="feature-grid">
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <h3>Smart Project Management</h3>
                <p>Organize projects, tasks, and content with AI-powered insights</p>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🤖</span>
                <h3>AI Agent Collaboration</h3>
                <p>Deploy autonomous agents to automate workflows and assist your team</p>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔗</span>
                <h3>Seamless Integrations</h3>
                <p>Connect with external APIs, storage systems, and development tools</p>
              </div>
            </div>
          </div>

          <div class="welcome-actions">
            <UIButton @click="createFirstProject" size="lg" class="primary-action">
              <span class="action-icon">➕</span>
              Create Your First Project
            </UIButton>
            <UIButton @click="exploreFeatures" variant="secondary" size="lg">
              <span class="action-icon">🧭</span>
              Explore Features
            </UIButton>
          </div>
        </div>
      </UICard>
    </section>

    <!-- Quick Access Navigation -->
    <section class="quick-access-section" aria-label="Quick Access">
      <h2 class="section-title">Quick Access</h2>
      <div class="quick-access-grid">
        <router-link to="/agents" class="access-card-link">
          <UICard variant="elevated" class="access-card" role="button" tabindex="0">
            <div class="access-content">
              <span class="access-icon">🤖</span>
              <h3>AI Agents</h3>
              <p>Manage and deploy intelligent agents</p>
              <span class="access-arrow">→</span>
            </div>
          </UICard>
        </router-link>
        
        <router-link to="/orchestration" class="access-card-link">
          <UICard variant="elevated" class="access-card" role="button" tabindex="0">
            <div class="access-content">
              <span class="access-icon">🎯</span>
              <h3>Business Center</h3>
              <p>Workflows and automation</p>
              <span class="access-arrow">→</span>
            </div>
          </UICard>
        </router-link>
        
        <router-link to="/mcp" class="access-card-link">
          <UICard variant="elevated" class="access-card" role="button" tabindex="0">
            <div class="access-content">
              <span class="access-icon">🔌</span>
              <h3>Integrations</h3>
              <p>Connect external services and APIs</p>
              <span class="access-arrow">→</span>
            </div>
          </UICard>
        </router-link>
      </div>
    </section>

    <!-- Projects Section -->
    <section class="projects-section" aria-label="Projects">
      <UICard variant="elevated" class="projects-card">
        <ProjectManager />
      </UICard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import ProjectManager from '@/components/ProjectManager.vue'
import { UICard, UIButton } from '@/ui'

const router = useRouter()
const projectStore = useProjectStore()

// Show welcome section only when there are no projects
const shouldShowWelcome = computed(() => projectStore.projects.length === 0)

function createFirstProject() {
  // This will trigger the ProjectManager's create dialog
  // We'll emit an event that ProjectManager can listen to
  const event = new CustomEvent('create-project', { detail: { isFirstProject: true } })
  window.dispatchEvent(event)
}

function exploreFeatures() {
  router.push('/agents')
}
</script>

<style scoped>
.home-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
  padding-bottom: var(--spacing-2xl);
}

/* Welcome Section */
.welcome-section {
  margin-bottom: var(--spacing-xl);
}

.welcome-card {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: var(--color-white);
  border: none;
}

.welcome-content {
  padding: var(--spacing-3xl);
}

.welcome-header {
  text-align: center;
  margin-bottom: var(--spacing-3xl);
}

.welcome-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-white);
}

.welcome-icon {
  font-size: var(--font-size-4xl);
}

.welcome-subtitle {
  margin: 0;
  font-size: var(--font-size-lg);
  color: rgba(255, 255, 255, 0.9);
  font-weight: var(--font-weight-normal);
}

.welcome-features {
  margin-bottom: var(--spacing-3xl);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-2xl);
}

.feature-item {
  text-align: center;
  padding: var(--spacing-xl);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-lg);
  backdrop-filter: blur(10px);
}

.feature-icon {
  font-size: var(--font-size-3xl);
  display: block;
  margin-bottom: var(--spacing-lg);
}

.feature-item h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
}

.feature-item p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.8);
  line-height: var(--line-height-relaxed);
}

.welcome-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.primary-action {
  background: var(--color-white);
  color: var(--color-primary);
  border: none;
  font-weight: var(--font-weight-semibold);
}

.primary-action:hover {
  background: var(--color-gray-100);
  transform: translateY(-2px);
}

.action-icon {
  margin-right: var(--spacing-sm);
}

/* Quick Access Section */
.section-title {
  margin: 0 0 var(--spacing-xl) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.access-card-link {
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease;
}

.access-card-link:hover {
  transform: translateY(-4px);
}

.access-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.access-card:hover {
  box-shadow: var(--shadow-xl);
}

.access-card:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.access-content {
  padding: var(--spacing-xl);
  text-align: center;
  position: relative;
}

.access-icon {
  font-size: var(--font-size-3xl);
  display: block;
  margin-bottom: var(--spacing-lg);
}

.access-content h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.access-content p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.access-arrow {
  position: absolute;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.access-card:hover .access-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* Projects Section */
.projects-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.projects-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.projects-card :deep(.ui-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Responsive Design */
@media (max-width: 768px) {
  .welcome-content {
    padding: var(--spacing-2xl);
  }
  
  .welcome-title {
    font-size: var(--font-size-2xl);
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .quick-access-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .welcome-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .home-content {
    gap: var(--spacing-xl);
  }
  
  .welcome-content {
    padding: var(--spacing-xl);
  }
  
  .access-content {
    padding: var(--spacing-lg);
  }
}
</style>