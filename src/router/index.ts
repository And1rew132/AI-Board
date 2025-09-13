import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import ProjectDetail from '@/views/ProjectDetail.vue'
import AgentManager from '@/views/AgentManager.vue'
import MCPManager from '@/views/MCPManager.vue'
import OrchestrationCenter from '@/views/OrchestrationCenter.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/project/:id',
    name: 'ProjectDetail',
    component: ProjectDetail,
    props: true
  },
  {
    path: '/agents',
    name: 'AgentManager',
    component: AgentManager
  },
  {
    path: '/mcp',
    name: 'MCPManager',
    component: MCPManager
  },
  {
    path: '/orchestration',
    name: 'OrchestrationCenter',
    component: OrchestrationCenter
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router