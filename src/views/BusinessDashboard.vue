<template>
  <div class="business-dashboard">
    <div class="dashboard-header">
      <h1>Business Automation Dashboard</h1>
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-icon">🤖</div>
          <div class="stat-info">
            <div class="stat-number">{{ activeAgents.length }}</div>
            <div class="stat-label">Active Agents</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📧</div>
          <div class="stat-info">
            <div class="stat-number">{{ urgentInquiries.length }}</div>
            <div class="stat-label">Urgent Inquiries</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-info">
            <div class="stat-number">{{ runningExecutions.length }}</div>
            <div class="stat-label">Active Workflows</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-info">
            <div class="stat-number">{{ unreadMessages.length }}</div>
            <div class="stat-label">Unread Messages</div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Quick Actions -->
      <div class="dashboard-section">
        <h2>Quick Actions</h2>
        <div class="action-cards">
          <button @click="createSampleInquiry" class="action-card">
            <div class="action-icon">📧</div>
            <div class="action-content">
              <div class="action-title">Simulate Customer Inquiry</div>
              <div class="action-description">Create a test customer inquiry to see automation in action</div>
            </div>
          </button>
          
          <button @click="createBusinessAgent" class="action-card">
            <div class="action-icon">🤖</div>
            <div class="action-content">
              <div class="action-title">Deploy Business Agent</div>
              <div class="action-description">Create a specialized agent for business automation</div>
            </div>
          </button>
          
          <button @click="setupWorkflow" class="action-card">
            <div class="action-icon">⚡</div>
            <div class="action-content">
              <div class="action-title">Setup Workflow</div>
              <div class="action-description">Configure automated business processes</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Real-time Activity Feed -->
      <div class="dashboard-section">
        <h2>Live Activity Feed</h2>
        <div class="activity-feed">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="activity.type">{{ activity.icon }}</div>
            <div class="activity-content">
              <div class="activity-text">{{ activity.text }}</div>
              <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
            </div>
          </div>
          <div v-if="recentActivities.length === 0" class="no-activity">
            No recent activity. Create some sample data to see the system in action!
          </div>
        </div>
      </div>

      <!-- Agent Collaboration Network -->
      <div class="dashboard-section">
        <h2>Agent Collaboration</h2>
        <div class="collaboration-view">
          <div v-for="agent in businessAgents" :key="agent.id" class="agent-node" @click="showAgentDetails(agent)">
            <div class="agent-avatar">{{ getAgentEmoji(agent.type) }}</div>
            <div class="agent-name">{{ agent.name }}</div>
            <div class="agent-status" :class="agent.status">{{ agent.status }}</div>
            <div class="message-count" v-if="getUnreadCount(agent.id) > 0">
              {{ getUnreadCount(agent.id) }}
            </div>
          </div>
          <div v-if="businessAgents.length === 0" class="no-agents">
            No business agents deployed yet. Create your first agent to enable automation!
          </div>
        </div>
      </div>

      <!-- Workflow Templates -->
      <div class="dashboard-section">
        <h2>Business Process Templates</h2>
        <div class="template-grid">
          <div v-for="template in popularTemplates" :key="template.id" 
               class="template-card" @click="deployTemplate(template)">
            <div class="template-icon">{{ getCategoryIcon(template.category) }}</div>
            <div class="template-info">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-description">{{ template.description }}</div>
              <div class="template-difficulty">{{ template.difficulty }}</div>
            </div>
            <div class="template-action">Deploy</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for agent creation -->
    <div v-if="showAgentModal" class="modal-overlay" @click="showAgentModal = false">
      <div class="modal-content" @click.stop>
        <h3>Create Business Agent</h3>
        <form @submit.prevent="submitAgent">
          <div class="form-group">
            <label>Agent Type</label>
            <select v-model="newAgent.type" required>
              <option value="customer_service">Customer Service</option>
              <option value="sales">Sales</option>
              <option value="marketing">Marketing</option>
              <option value="operations">Operations</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>
          <div class="form-group">
            <label>Agent Name</label>
            <input v-model="newAgent.name" type="text" required placeholder="Enter agent name">
          </div>
          <div class="form-group">
            <label>Specialization</label>
            <input v-model="newAgent.specialization" type="text" placeholder="e.g., email_support, lead_qualification">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="newAgent.description" placeholder="Describe the agent's role and capabilities"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAgentModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Create Agent</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAgentStore } from '@/stores/agents'
import { useBusinessStore } from '@/stores/business'
import { useCommunicationStore } from '@/stores/communication'

const agentStore = useAgentStore()
const businessStore = useBusinessStore()
const communicationStore = useCommunicationStore()

const showAgentModal = ref(false)
const recentActivities = ref<any[]>([])
const newAgent = ref({
  type: 'customer_service',
  name: '',
  specialization: '',
  description: ''
})

// Computed properties
const activeAgents = computed(() => agentStore.activeAgents)
const urgentInquiries = computed(() => businessStore.urgentInquiries)
const runningExecutions = computed(() => businessStore.runningExecutions)
const unreadMessages = computed(() => communicationStore.unreadMessages)
const businessAgents = computed(() => agentStore.agents.filter(a => 
  a.name.toLowerCase().includes('customer') || 
  a.name.toLowerCase().includes('sales') || 
  a.name.toLowerCase().includes('marketing') ||
  a.description.toLowerCase().includes('business')
))
const popularTemplates = computed(() => businessStore.templates.slice(0, 3))

// Functions
function createSampleInquiry() {
  const sampleInquiries = [
    {
      subject: 'Billing Issue - Payment Failed',
      content: 'Hi, my payment failed yesterday and I need help resolving this urgent billing issue.',
      source: 'email' as const,
      customerInfo: {
        name: 'John Smith',
        email: 'john.smith@example.com',
        customerId: 'CUST-001'
      }
    },
    {
      subject: 'Feature Request - API Integration',
      content: 'We would like to request a new API endpoint for our enterprise integration needs.',
      source: 'form' as const,
      customerInfo: {
        name: 'Sarah Wilson',
        email: 'sarah@enterprise.com',
        company: 'Enterprise Corp'
      }
    },
    {
      subject: 'Technical Support - Login Problems',
      content: 'I cannot log into my account. Getting error messages repeatedly. Please help!',
      source: 'chat' as const,
      customerInfo: {
        name: 'Mike Johnson',
        email: 'mike.j@email.com'
      }
    }
  ]

  const randomInquiry = sampleInquiries[Math.floor(Math.random() * sampleInquiries.length)]
  
  const inquiry = businessStore.createInquiry({
    ...randomInquiry,
    category: 'other', // Let auto-categorization work
    priority: 'medium', // Let auto-prioritization work
    status: 'new',
    tags: []
  })

  addActivity({
    type: 'inquiry',
    icon: '📧',
    text: `New customer inquiry created: "${inquiry.subject}"`,
    timestamp: new Date()
  })

  // Simulate agent assignment after a delay
  setTimeout(() => {
    const customerServiceAgents = agentStore.agents.filter(a => 
      a.name.toLowerCase().includes('customer') ||
      a.name.toLowerCase().includes('support') ||
      a.description.toLowerCase().includes('customer')
    )
    
    if (customerServiceAgents.length > 0) {
      const assignedAgent = customerServiceAgents[0]
      businessStore.updateInquiry(inquiry.id, {
        status: 'assigned',
        assignedAgentId: assignedAgent.id
      })

      addActivity({
        type: 'assignment',
        icon: '🤖',
        text: `Inquiry assigned to ${assignedAgent.name} automatically`,
        timestamp: new Date()
      })

      // Simulate agent response
      setTimeout(() => {
        businessStore.addInquiryResponse(inquiry.id, {
          content: generateAutomatedResponse(inquiry.category, inquiry.subject),
          sender: {
            type: 'agent',
            id: assignedAgent.id,
            name: assignedAgent.name
          },
          isPublic: true,
          attachments: []
        })

        addActivity({
          type: 'response',
          icon: '💬',
          text: `${assignedAgent.name} responded to customer inquiry`,
          timestamp: new Date()
        })
      }, 3000)
    }
  }, 2000)
}

function generateAutomatedResponse(category: string, subject: string): string {
  const responses = {
    billing: `Thank you for contacting us about your billing concern. I've reviewed your account and will help resolve this payment issue immediately. I'm escalating this to our billing specialist who will contact you within the next hour with a solution.`,
    
    feature_request: `Thank you for your feature request regarding "${subject}". This is valuable feedback that we'll add to our product roadmap. Our product team will review this request and we'll update you on the timeline within 3-5 business days.`,
    
    support: `I understand you're experiencing technical difficulties with "${subject}". I've created a support ticket and our technical team will investigate this immediately. In the meantime, I've sent you some troubleshooting steps to your email that might help resolve the issue faster.`,
    
    default: `Thank you for reaching out to us. I've received your inquiry about "${subject}" and will ensure it's handled promptly. You can expect a detailed response from our team within 2-4 hours.`
  }

  return responses[category as keyof typeof responses] || responses.default
}

function createBusinessAgent() {
  showAgentModal.value = true
}

function submitAgent() {
  const agentConfig = {
    name: newAgent.value.name,
    description: newAgent.value.description,
    type: 'autonomous' as const,
    status: 'active' as const,
    capabilities: getCapabilitiesForType(newAgent.value.type),
    config: {
      autonomyLevel: 'medium' as const,
      promptingStrategy: 'task_driven' as const,
      mcpEndpoints: [],
      storageAccess: true,
      collaboration: {
        canCreateProjects: false,
        canModifyOtherAgentWork: false,
        requiresApproval: true
      }
    },
    projects: []
  }

  const agent = agentStore.createAgent(agentConfig)

  addActivity({
    type: 'agent',
    icon: '🤖',
    text: `New ${newAgent.value.type.replace('_', ' ')} agent "${agent.name}" deployed`,
    timestamp: new Date()
  })

  // Reset form
  newAgent.value = {
    type: 'customer_service',
    name: '',
    specialization: '',
    description: ''
  }
  showAgentModal.value = false

  // Send welcome message to new agent
  setTimeout(() => {
    communicationStore.sendMessage({
      fromAgentId: 'system',
      toAgentId: agent.id,
      type: 'information_request',
      content: `Welcome to the business automation platform! You are now active and ready to help with ${newAgent.value.type.replace('_', ' ')} tasks. Your specialization is: ${newAgent.value.specialization || 'general business support'}.`,
      context: { type: 'welcome' },
      priority: 'medium',
      requiresResponse: false
    })
  }, 1000)
}

function getCapabilitiesForType(type: string): any[] {
  const capabilityMap: Record<string, any[]> = {
    customer_service: [
      { type: 'content_creation', description: 'Handle customer inquiries and support', enabled: true },
      { type: 'content_creation', description: 'Create support documentation', enabled: true },
      { type: 'ai_generation', description: 'Generate responses using AI', enabled: true }
    ],
    sales: [
      { type: 'content_creation', description: 'Engage with prospects and leads', enabled: true },
      { type: 'analysis', description: 'Analyze sales data and trends', enabled: true },
      { type: 'content_creation', description: 'Create sales materials', enabled: true }
    ],
    marketing: [
      { type: 'content_creation', description: 'Create marketing content', enabled: true },
      { type: 'analysis', description: 'Analyze marketing metrics', enabled: true },
      { type: 'ai_generation', description: 'Generate marketing copy', enabled: true }
    ],
    operations: [
      { type: 'api_integration', description: 'Automate business processes', enabled: true },
      { type: 'analysis', description: 'Monitor operational metrics', enabled: true },
      { type: 'file_management', description: 'Manage operational documents', enabled: true }
    ],
    analytics: [
      { type: 'analysis', description: 'Advanced data analysis', enabled: true },
      { type: 'ai_generation', description: 'Generate insights and reports', enabled: true },
      { type: 'api_integration', description: 'Connect to analytics tools', enabled: true }
    ]
  }

  return capabilityMap[type] || []
}

function setupWorkflow() {
  // For now, just deploy the default customer service workflow
  const template = businessStore.templates[0]
  if (template) {
    deployTemplate(template)
  }
}

function deployTemplate(template: any) {
  const workflow = businessStore.createWorkflowFromTemplate(template.id, {
    name: `${template.name} - ${Date.now()}`
  })

  addActivity({
    type: 'workflow',
    icon: '⚡',
    text: `Deployed workflow: "${workflow.name}"`,
    timestamp: new Date()
  })

  // Execute a test run
  setTimeout(() => {
    businessStore.executeWorkflow(workflow.id, { test: true }, 'system')
    
    addActivity({
      type: 'execution',
      icon: '🚀',
      text: `Started workflow execution: "${workflow.name}"`,
      timestamp: new Date()
    })
  }, 1000)
}

function showAgentDetails(agent: any) {
  // For now, just show agent messages
  const messages = communicationStore.getMessagesForAgent(agent.id)
  console.log(`Agent ${agent.name} messages:`, messages)
}

function getAgentEmoji(type: string): string {
  const emojiMap = {
    customer_service: '🎧',
    sales: '💼',
    marketing: '📢',
    operations: '⚙️',
    analytics: '📊',
    development: '💻',
    general: '🤖'
  }
  return emojiMap[type as keyof typeof emojiMap] || '🤖'
}

function getCategoryIcon(category: string): string {
  const iconMap = {
    customer_service: '🎧',
    sales: '💼',
    marketing: '📢',
    operations: '⚙️',
    development: '💻',
    custom: '⚡'
  }
  return iconMap[category as keyof typeof iconMap] || '⚡'
}

function getUnreadCount(agentId: string): number {
  return communicationStore.getUnreadMessagesForAgent(agentId).length
}

function formatTime(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function addActivity(activity: any) {
  recentActivities.value.unshift({
    id: generateId(),
    ...activity
  })
  
  // Keep only last 10 activities
  if (recentActivities.value.length > 10) {
    recentActivities.value = recentActivities.value.slice(0, 10)
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

onMounted(() => {
  // Add initial activities
  addActivity({
    type: 'system',
    icon: '🚀',
    text: 'Business automation platform initialized',
    timestamp: new Date()
  })
})
</script>

<style scoped>
.business-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  color: #2d3748;
  margin-bottom: 1rem;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
}

.stat-label {
  color: #718096;
  font-size: 0.9rem;
}

.dashboard-content {
  display: grid;
  gap: 2rem;
}

.dashboard-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dashboard-section h2 {
  color: #2d3748;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.action-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.action-title {
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.action-description {
  color: #718096;
  font-size: 0.9rem;
}

.activity-feed {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f7fafc;
}

.activity-icon.inquiry { background: #fed7d7; }
.activity-icon.agent { background: #c6f6d5; }
.activity-icon.workflow { background: #bee3f8; }
.activity-icon.execution { background: #fbb6ce; }
.activity-icon.assignment { background: #d9f7be; }
.activity-icon.response { background: #fff7ed; }
.activity-icon.system { background: #e6fffa; }

.activity-text {
  color: #2d3748;
  font-weight: 500;
}

.activity-time {
  color: #718096;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.no-activity {
  text-align: center;
  color: #718096;
  padding: 2rem;
  font-style: italic;
}

.collaboration-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.agent-node {
  text-align: center;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.agent-node:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.agent-avatar {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.agent-name {
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.agent-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.agent-status.active { background: #c6f6d5; color: #22543d; }
.agent-status.busy { background: #fed7d7; color: #742a2a; }
.agent-status.idle { background: #e2e8f0; color: #4a5568; }

.message-count {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #e53e3e;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.no-agents {
  text-align: center;
  color: #718096;
  padding: 2rem;
  font-style: italic;
  grid-column: 1 / -1;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.template-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.template-name {
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.template-description {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.template-difficulty {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #edf2f7;
  color: #4a5568;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: capitalize;
}

.template-action {
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border-radius: 4px;
  font-weight: 500;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: #5a67d8;
}

.btn-secondary {
  background: transparent;
  color: #4a5568;
  border: 2px solid #e2e8f0;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: #cbd5e0;
  background: #f7fafc;
}
</style>