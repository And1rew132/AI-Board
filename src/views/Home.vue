<template>
  <div class="home-content">
    <UICard variant="elevated" class="projects-card">
      <ProjectManager />
    </UICard>
  </div>
</template>

<script setup lang="ts">
import ProjectManager from '@/components/ProjectManager.vue'
import { UICard } from '@/ui'
</script>

<style scoped>
.home-content {
  height: 100%;
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
</style>