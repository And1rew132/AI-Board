<template>
  <div class="business-demo">
    <div class="demo-header">
      <h2>🎯 Live Business Automation Demo</h2>
      <p>Watch agents collaborate to handle real business scenarios in real-time</p>
      <div class="demo-controls">
        <button @click="startCustomerServiceDemo" class="btn btn-primary" :disabled="demoRunning">
          🎬 Start Customer Service Demo
        </button>
        <button @click="startContentCreationDemo" class="btn btn-success" :disabled="demoRunning">
          📝 Start Content Creation Demo
        </button>
        <button @click="startDataAnalysisDemo" class="btn btn-info" :disabled="demoRunning">
          📊 Start Data Analysis Demo
        </button>
        <button v-if="demoRunning" @click="stopDemo" class="btn btn-danger">
          ⏹️ Stop Demo
        </button>
      </div>
    </div>

    <!-- Live Scenario Display -->
    <div v-if="currentScenario" class="scenario-display">
      <div class="scenario-header">
        <h3>{{ currentScenario.title }}</h3>
        <div class="scenario-status" :class="currentScenario.status">
          {{ currentScenario.status }}
        </div>
      </div>
      
      <div class="scenario-description">
        <p>{{ currentScenario.description }}</p>
      </div>
      
      <!-- Progress Timeline -->
      <div class="scenario-timeline">
        <div 
          v-for="(step, index) in currentScenario.steps" 
          :key="index"
          class="timeline-step"
          :class="{ active: step.status === 'active', completed: step.status === 'completed' }"
        >
          <div class="step-marker">
            <span v-if="step.status === 'completed'">✅</span>
            <span v-else-if="step.status === 'active'">⚡</span>
            <span v-else>⏳</span>
          </div>
          <div class="step-content">
            <h4>{{ step.agent }}</h4>
            <p>{{ step.action }}</p>
            <div v-if="step.result" class="step-result">
              <strong>Result:</strong> {{ step.result }}
            </div>
            <div v-if="step.duration" class="step-duration">
              Duration: {{ step.duration }}ms
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Agent Collaboration Network -->
    <div v-if="demoRunning" class="collaboration-network">
      <h3>🤝 Agent Collaboration Network</h3>
      <div class="network-visualization">
        <div 
          v-for="agent in activeAgents" 
          :key="agent.id"
          class="agent-node"
          :class="{ active: agent.active }"
        >
          <div class="agent-avatar">{{ agent.emoji }}</div>
          <div class="agent-info">
            <h4>{{ agent.name }}</h4>
            <p>{{ agent.status }}</p>
          </div>
        </div>
        
        <!-- Connection Lines (animated) -->
        <div class="connection-lines">
          <div 
            v-for="connection in activeConnections" 
            :key="connection.id"
            class="connection-line"
            :style="connection.style"
          >
            <div class="message-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Business Metrics -->
    <div v-if="demoRunning" class="business-metrics">
      <h3>📈 Real-time Business Impact</h3>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">⚡</div>
          <div class="metric-value">{{ businessMetrics.processingSpeed }}x</div>
          <div class="metric-label">Faster Processing</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">💰</div>
          <div class="metric-value">${{ businessMetrics.costSavings }}</div>
          <div class="metric-label">Cost Savings/Hour</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">😊</div>
          <div class="metric-value">{{ businessMetrics.satisfactionScore }}%</div>
          <div class="metric-label">Customer Satisfaction</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🎯</div>
          <div class="metric-value">{{ businessMetrics.accuracy }}%</div>
          <div class="metric-label">Accuracy Rate</div>
        </div>
      </div>
    </div>

    <!-- Customer Service Demo Scenario -->
    <div v-if="customerTicket" class="customer-scenario">
      <h3>📞 Customer Service Scenario</h3>
      <div class="customer-ticket">
        <div class="ticket-header">
          <h4>Support Ticket #{{ customerTicket.id }}</h4>
          <div class="ticket-priority" :class="customerTicket.priority">
            {{ customerTicket.priority.toUpperCase() }}
          </div>
        </div>
        <div class="customer-message">
          <strong>Customer:</strong> {{ customerTicket.message }}
        </div>
        <div v-if="customerTicket.analysis" class="ai-analysis">
          <strong>AI Analysis:</strong> {{ customerTicket.analysis }}
        </div>
        <div v-if="customerTicket.response" class="ai-response">
          <strong>Generated Response:</strong> {{ customerTicket.response }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

// Demo state
const demoRunning = ref(false);
const currentScenario = ref<any>(null);
const customerTicket = ref<any>(null);
const demoInterval = ref<NodeJS.Timeout | null>(null);

// Agent network visualization
const activeAgents = ref([
  { id: 'analyzer', name: 'Analysis Agent', emoji: '🔍', status: 'Ready', active: false },
  { id: 'content', name: 'Content Agent', emoji: '✍️', status: 'Ready', active: false },
  { id: 'developer', name: 'Developer Agent', emoji: '👨‍💻', status: 'Ready', active: false },
  { id: 'support', name: 'Support Agent', emoji: '🎧', status: 'Ready', active: false }
]);

const activeConnections = ref<any[]>([]);

// Business metrics
const businessMetrics = ref({
  processingSpeed: 5,
  costSavings: 150,
  satisfactionScore: 94,
  accuracy: 97
});

// Demo scenarios
async function startCustomerServiceDemo() {
  demoRunning.value = true;
  
  // Create customer ticket
  customerTicket.value = {
    id: Math.floor(Math.random() * 10000),
    priority: 'high',
    message: "Hi, I'm having trouble with my account login. I keep getting an error message that says 'invalid credentials' even though I'm sure my password is correct. I've tried resetting it twice but the same issue persists. This is urgent as I need to access my account for an important meeting today.",
    analysis: null,
    response: null
  };
  
  currentScenario.value = {
    title: '🎧 Customer Service Automation',
    description: 'An urgent customer login issue is being processed through our automated agent workflow',
    status: 'running',
    steps: [
      { agent: 'Ticket Router', action: 'Categorizing customer inquiry', status: 'completed', result: 'Technical Support - High Priority', duration: 250 },
      { agent: 'Analysis Agent', action: 'Analyzing customer message for intent and urgency', status: 'active' },
      { agent: 'Knowledge Agent', action: 'Searching knowledge base for solutions', status: 'pending' },
      { agent: 'Response Agent', action: 'Generating personalized response', status: 'pending' },
      { agent: 'Quality Agent', action: 'Reviewing response quality', status: 'pending' },
      { agent: 'Delivery Agent', action: 'Sending response to customer', status: 'pending' }
    ]
  };
  
  // Simulate step-by-step processing
  let stepIndex = 1;
  demoInterval.value = setInterval(() => {
    if (stepIndex < currentScenario.value.steps.length) {
      // Complete current step
      currentScenario.value.steps[stepIndex - 1].status = 'completed';
      
      // Activate next step
      const currentStep = currentScenario.value.steps[stepIndex];
      currentStep.status = 'active';
      
      // Simulate agent work
      setTimeout(() => {
        switch (stepIndex) {
          case 1: // Analysis Agent
            currentStep.result = 'Intent: Account Access Issue | Urgency: High | Category: Authentication';
            currentStep.duration = 800;
            customerTicket.value.analysis = 'Customer experiencing authentication issues. Multiple password reset attempts indicate possible account lock or system issue.';
            activateAgent('analyzer');
            break;
            
          case 2: // Knowledge Agent
            currentStep.result = 'Found 3 relevant solutions | Confidence: 95%';
            currentStep.duration = 1200;
            activateAgent('support');
            break;
            
          case 3: // Response Agent
            currentStep.result = 'Personalized response generated with solution steps';
            currentStep.duration = 600;
            customerTicket.value.response = "Hello! I understand how frustrating login issues can be, especially when you have an urgent meeting. I've identified that your account may be temporarily locked due to multiple reset attempts. I've unlocked your account and sent you a secure login link to your registered email. Please try logging in again, and if you still experience issues, I'm here to help immediately.";
            activateAgent('content');
            break;
            
          case 4: // Quality Agent
            currentStep.result = 'Quality check passed | Tone: Professional & Empathetic';
            currentStep.duration = 300;
            break;
            
          case 5: // Delivery Agent
            currentStep.result = 'Response sent successfully | Delivery confirmed';
            currentStep.duration = 200;
            currentScenario.value.status = 'completed';
            updateBusinessMetrics();
            stopDemo();
            break;
        }
      }, 1500);
      
      stepIndex++;
    }
  }, 3000);
}

async function startContentCreationDemo() {
  demoRunning.value = true;
  
  currentScenario.value = {
    title: '📝 Content Creation Pipeline',
    description: 'Creating a blog post about AI automation trends from research to publication',
    status: 'running',
    steps: [
      { agent: 'Research Agent', action: 'Gathering latest AI automation trends', status: 'active' },
      { agent: 'Content Strategist', action: 'Creating content outline and structure', status: 'pending' },
      { agent: 'Writer Agent', action: 'Writing engaging blog post content', status: 'pending' },
      { agent: 'SEO Agent', action: 'Optimizing for search engines', status: 'pending' },
      { agent: 'Editor Agent', action: 'Reviewing and refining content', status: 'pending' },
      { agent: 'Publisher Agent', action: 'Scheduling and publishing content', status: 'pending' }
    ]
  };
  
  // Similar demo logic for content creation
  simulateWorkflowSteps();
}

async function startDataAnalysisDemo() {
  demoRunning.value = true;
  
  currentScenario.value = {
    title: '📊 Data Analysis & Reporting',
    description: 'Analyzing customer behavior data to generate actionable business insights',
    status: 'running',
    steps: [
      { agent: 'Data Collector', action: 'Gathering customer interaction data', status: 'active' },
      { agent: 'Data Cleaner', action: 'Processing and cleaning raw data', status: 'pending' },
      { agent: 'Analytics Agent', action: 'Performing statistical analysis', status: 'pending' },
      { agent: 'Insights Agent', action: 'Generating business insights', status: 'pending' },
      { agent: 'Visualization Agent', action: 'Creating charts and dashboards', status: 'pending' },
      { agent: 'Report Agent', action: 'Compiling executive summary', status: 'pending' }
    ]
  };
  
  simulateWorkflowSteps();
}

function simulateWorkflowSteps() {
  let stepIndex = 1;
  demoInterval.value = setInterval(() => {
    if (stepIndex < currentScenario.value.steps.length) {
      currentScenario.value.steps[stepIndex - 1].status = 'completed';
      currentScenario.value.steps[stepIndex - 1].duration = Math.floor(Math.random() * 1000) + 500;
      
      const currentStep = currentScenario.value.steps[stepIndex];
      currentStep.status = 'active';
      
      // Randomly activate agents for visual effect
      const agentIndex = Math.floor(Math.random() * activeAgents.value.length);
      activateAgent(activeAgents.value[agentIndex].id);
      
      stepIndex++;
    } else {
      currentScenario.value.status = 'completed';
      updateBusinessMetrics();
      stopDemo();
    }
  }, 2500);
}

function activateAgent(agentId: string) {
  const agent = activeAgents.value.find(a => a.id === agentId);
  if (agent) {
    agent.active = true;
    agent.status = 'Working...';
    
    // Deactivate after a short time
    setTimeout(() => {
      agent.active = false;
      agent.status = 'Ready';
    }, 2000);
  }
}

function updateBusinessMetrics() {
  businessMetrics.value.processingSpeed += Math.floor(Math.random() * 3) + 1;
  businessMetrics.value.costSavings += Math.floor(Math.random() * 50) + 25;
  businessMetrics.value.satisfactionScore = Math.min(99, businessMetrics.value.satisfactionScore + Math.floor(Math.random() * 3));
  businessMetrics.value.accuracy = Math.min(99, businessMetrics.value.accuracy + Math.floor(Math.random() * 2));
}

function stopDemo() {
  demoRunning.value = false;
  if (demoInterval.value) {
    clearInterval(demoInterval.value);
    demoInterval.value = null;
  }
  
  // Reset agent states
  activeAgents.value.forEach(agent => {
    agent.active = false;
    agent.status = 'Ready';
  });
  
  setTimeout(() => {
    currentScenario.value = null;
    customerTicket.value = null;
  }, 5000);
}

onUnmounted(() => {
  if (demoInterval.value) {
    clearInterval(demoInterval.value);
  }
});
</script>

<style scoped>
.business-demo {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 2rem;
}

.demo-header h2 {
  color: #4f46e5;
  margin-bottom: 0.5rem;
}

.demo-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.scenario-display {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.scenario-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.scenario-header h3 {
  margin: 0;
  color: #374151;
}

.scenario-status {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  text-transform: capitalize;
}

.scenario-status.running {
  background: #fef3c7;
  color: #d97706;
}

.scenario-status.completed {
  background: #d1fae5;
  color: #059669;
}

.scenario-description {
  margin-bottom: 2rem;
  color: #6b7280;
}

.scenario-timeline {
  space-y: 1rem;
}

.timeline-step {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.timeline-step.active {
  background: #fef3c7;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.timeline-step.completed {
  background: #f0fdf4;
  border-color: #22c55e;
}

.step-marker {
  font-size: 1.5rem;
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.step-content p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
}

.step-result {
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.step-duration {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.collaboration-network {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.collaboration-network h3 {
  margin: 0 0 1.5rem 0;
  color: #374151;
}

.network-visualization {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  min-height: 300px;
}

.agent-node {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s;
}

.agent-node.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #4f46e5;
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);
}

.agent-avatar {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.agent-info h4 {
  margin: 0 0 0.5rem 0;
}

.agent-info p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.business-metrics {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.business-metrics h3 {
  margin: 0 0 1.5rem 0;
  color: #374151;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
}

.metric-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.customer-scenario {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.customer-scenario h3 {
  margin: 0 0 1.5rem 0;
  color: #374151;
}

.customer-ticket {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.ticket-header h4 {
  margin: 0;
  color: #374151;
}

.ticket-priority {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.ticket-priority.high {
  background: #fee2e2;
  color: #dc2626;
}

.customer-message,
.ai-analysis,
.ai-response {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
}

.customer-message {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
}

.ai-analysis {
  background: #fef3c7;
  border: 1px solid #f59e0b;
}

.ai-response {
  background: #f0fdf4;
  border: 1px solid #22c55e;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-success {
  background: #059669;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #047857;
}

.btn-info {
  background: #0891b2;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #0e7490;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}
</style>