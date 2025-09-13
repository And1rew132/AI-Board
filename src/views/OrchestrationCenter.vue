<template>
  <div class="orchestration-view">
    <OrchestrationDashboard />
  </div>
</template>

<script setup lang="ts">
import OrchestrationDashboard from '@/components/OrchestrationDashboard.vue';
</script>

<style scoped>
.orchestration-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}
</style>