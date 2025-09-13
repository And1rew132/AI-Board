import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import ProjectDetail from '@/views/ProjectDetail.vue'
import AgentManager from '@/views/AgentManager.vue'
import MCPManager from '@/views/MCPManager.vue'
import BusinessDashboard from '@/views/BusinessDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/business',
    name: 'BusinessDashboard',
    component: BusinessDashboard
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router