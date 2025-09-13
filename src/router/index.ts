import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'
import Home from '@/views/Home.vue'
import ProjectManager from '@/views/ProjectManager.vue'
import ProjectDetail from '@/views/ProjectDetail.vue'
import AgentManager from '@/views/AgentManager.vue'
import MCPManager from '@/views/MCPManager.vue'
import OrchestrationCenter from '@/views/OrchestrationCenter.vue'
import BusinessCenter from '@/views/BusinessCenter.vue'

const routes = [
  {
    path: '/',
    component: DashboardLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: Home
      },
      {
        path: 'projects',
        name: 'ProjectManager',
        component: ProjectManager
      },
      {
        path: 'project/:id',
        name: 'ProjectDetail',
        component: ProjectDetail,
        props: true
      },
      // Projects section sub-routes
      {
        path: 'projects/active',
        name: 'ProjectsActive',
        component: ProjectManager,
        props: { filter: 'active' }
      },
      {
        path: 'projects/templates',
        name: 'ProjectsTemplates', 
        component: ProjectManager,
        props: { filter: 'templates' }
      },
      // Agents section and sub-routes
      {
        path: 'agents',
        name: 'AgentManager',
        component: AgentManager
      },
      {
        path: 'agents/performance',
        name: 'AgentsPerformance',
        component: AgentManager // For now, reuse AgentManager
      },
      {
        path: 'agents/training',
        name: 'AgentsTraining',
        component: AgentManager // For now, reuse AgentManager
      },
      // Orchestration section and sub-routes
      {
        path: 'orchestration',
        name: 'BusinessCenter',
        component: BusinessCenter,
        meta: { 
          title: 'Business Center',
          description: 'Orchestrate workflows and business processes'
        }
      },
      {
        path: 'orchestration/workflows',
        name: 'OrchestrationWorkflows',
        component: OrchestrationCenter // For now, reuse OrchestrationCenter for sub-routes
      },
      {
        path: 'orchestration/automation',
        name: 'OrchestrationAutomation',
        component: OrchestrationCenter // For now, reuse OrchestrationCenter for sub-routes
      },
      // MCP/Integrations section and sub-routes
      {
        path: 'mcp',
        name: 'MCPManager',
        component: MCPManager
      },
      {
        path: 'mcp/apis',
        name: 'MCPApis',
        component: MCPManager // For now, reuse MCPManager
      },
      {
        path: 'mcp/webhooks',
        name: 'MCPWebhooks',
        component: MCPManager // For now, reuse MCPManager
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router