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
      <router-link to="/business" class="nav-item">
        <span class="icon">🏢</span>
        Business Dashboard
      </router-link>
      <router-link to="/agents" class="nav-item">
        <span class="icon">🤖</span>
        Agents
      </router-link>
      <router-link to="/mcp" class="nav-item">
        <span class="icon">🔌</span>
        MCP Integrations
      </router-link>
    </nav>

    <main class="main-content">
      <ProjectManager />
    </main>
  </div>
</template>

<script setup lang="ts">
import ProjectManager from '@/components/ProjectManager.vue'
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 1.2rem;
}

.main-nav {
  display: flex;
  justify-content: center;
  padding: 1rem;
  gap: 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 25px;
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.nav-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.nav-item.active {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.icon {
  font-size: 1.2rem;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  margin-top: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}
</style>