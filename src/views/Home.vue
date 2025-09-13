<template>
  <div class="home">
    <header class="app-header">
      <h1>AI Board</h1>
      <p class="subtitle">Multi-Agent Project Management</p>
    </header>

    <nav class="main-nav">
      <router-link to="/" class="nav-item active">
        <span class="icon">🏠</span>
        Projects
      </router-link>
      <router-link to="/agents" class="nav-item">
        <span class="icon">🤖</span>
        Agents
      </router-link>
      <router-link to="/orchestration" class="nav-item">
        <span class="icon">🎯</span>
        Business Center
      </router-link>
      <router-link to="/mcp" class="nav-item">
        <span class="icon">🔌</span>
        MCP Integrations
      </router-link>
    </nav>

    <UICard variant="elevated" class="main-content">
      <ProjectManager />
    </UICard>
  </div>
</template>

<script setup lang="ts">
import ProjectManager from '@/components/ProjectManager.vue'
import { UICard } from '@/ui'
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
}

.app-header {
  background: var(--color-backdrop-blur);
  backdrop-filter: blur(10px);
  padding: var(--spacing-3xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.app-header h1 {
  margin: 0;
  font-size: var(--font-size-5xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: var(--spacing-sm) 0 0 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-xl);
}

.main-nav {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
  gap: var(--spacing-lg);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-backdrop-blur);
  border-radius: var(--border-radius-full);
  text-decoration: none;
  color: var(--color-gray-700);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
}

.nav-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.nav-item.active {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary);
}

.icon {
  font-size: var(--font-size-xl);
}

.main-content {
  max-width: 1200px;
  margin: var(--spacing-3xl) auto;
  margin-bottom: var(--spacing-3xl);
}
</style>