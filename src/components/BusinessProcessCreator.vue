<template>
  <div class="business-process-creator">
    <form @submit.prevent="createBusinessProcess">
      <!-- Basic Information -->
      <div class="form-section">
        <h3>Business Process Information</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="name">Process Name</label>
            <input
              id="name"
              v-model="businessProcess.name"
              type="text"
              required
              placeholder="e.g., Customer Onboarding Flow"
            />
          </div>
          
          <div class="form-group">
            <label for="category">Category</label>
            <select id="category" v-model="businessProcess.category" required>
              <option value="customer_onboarding">Customer Onboarding</option>
              <option value="support_ticket">Support Ticket</option>
              <option value="content_pipeline">Content Pipeline</option>
              <option value="data_analysis">Data Analysis</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="businessProcess.description"
            rows="3"
            required
            placeholder="Describe what this business process accomplishes..."
          ></textarea>
        </div>
      </div>

      <!-- Workflow Selection -->
      <div class="form-section">
        <h3>Associated Workflow</h3>
        <div class="workflow-selection">
          <div class="form-group">
            <label for="workflow">Select Workflow</label>
            <select id="workflow" v-model="businessProcess.workflowId" required>
              <option value="">-- Select a workflow --</option>
              <option 
                v-for="workflow in availableWorkflows" 
                :key="workflow.id"
                :value="workflow.id"
              >
                {{ workflow.name }} ({{ workflow.type }})
              </option>
            </select>
          </div>
          
          <div v-if="selectedWorkflow" class="workflow-preview">
            <h4>Selected Workflow: {{ selectedWorkflow.name }}</h4>
            <p>{{ selectedWorkflow.description }}</p>
            <div class="workflow-meta">
              <span class="meta-badge">{{ selectedWorkflow.steps.length }} steps</span>
              <span class="meta-badge">{{ selectedWorkflow.category }}</span>
              <span class="meta-badge">{{ selectedWorkflow.type }}</span>
            </div>
          </div>
          
          <div class="create-new-workflow">
            <p>Don't see the workflow you need?</p>
            <button 
              type="button" 
              @click="showWorkflowCreator = true"
              class="btn btn-outline"
            >
              Create New Workflow
            </button>
          </div>
        </div>
      </div>

      <!-- Process Configuration -->
      <div class="form-section">
        <h3>Process Configuration</h3>
        <div class="config-editor">
          <div class="config-presets">
            <h4>Quick Setup</h4>
            <div class="preset-buttons">
              <button 
                v-for="preset in configPresets" 
                :key="preset.name"
                type="button"
                @click="applyPreset(preset)"
                class="btn btn-sm btn-secondary"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>
          
          <div class="config-form">
            <h4>Custom Configuration</h4>
            <div 
              v-for="(configItem, index) in configItems" 
              :key="index"
              class="config-item"
            >
              <div class="config-item-header">
                <input
                  v-model="configItem.key"
                  type="text"
                  placeholder="Configuration key"
                  class="config-key"
                />
                <select v-model="configItem.type" class="config-type">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="email">Email</option>
                  <option value="url">URL</option>
                </select>
                <button
                  type="button"
                  @click="removeConfigItem(index)"
                  class="btn btn-sm btn-danger"
                >
                  🗑️
                </button>
              </div>
              
              <div class="config-item-content">
                <input
                  v-if="configItem.type === 'text' || configItem.type === 'email' || configItem.type === 'url'"
                  v-model="configItem.value"
                  :type="configItem.type"
                  :placeholder="`Enter ${configItem.type} value`"
                  class="config-value"
                />
                <input
                  v-else-if="configItem.type === 'number'"
                  v-model.number="configItem.value"
                  type="number"
                  placeholder="Enter number value"
                  class="config-value"
                />
                <select
                  v-else-if="configItem.type === 'boolean'"
                  v-model="configItem.value"
                  class="config-value"
                >
                  <option :value="true">True</option>
                  <option :value="false">False</option>
                </select>
                
                <input
                  v-model="configItem.description"
                  type="text"
                  placeholder="Description (optional)"
                  class="config-description"
                />
              </div>
            </div>
            
            <button
              type="button"
              @click="addConfigItem"
              class="btn btn-sm btn-success"
            >
              ➕ Add Configuration Item
            </button>
          </div>
        </div>
      </div>

      <!-- Process Templates -->
      <div class="form-section">
        <h3>Process Templates</h3>
        <div class="template-selector">
          <div class="template-grid">
            <div 
              v-for="template in processTemplates" 
              :key="template.name"
              class="template-card"
              :class="{ active: selectedTemplate === template.name }"
              @click="applyTemplate(template)"
            >
              <div class="template-header">
                <h4>{{ template.name }}</h4>
                <div class="template-category">{{ template.category }}</div>
              </div>
              <p class="template-description">{{ template.description }}</p>
              <div class="template-features">
                <div class="feature-list">
                  <span 
                    v-for="feature in template.features" 
                    :key="feature"
                    class="feature-tag"
                  >
                    {{ feature }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="resetForm" class="btn btn-secondary">
          Reset
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!isFormValid">
          Create Business Process
        </button>
      </div>
    </form>

    <!-- Workflow Creator Modal -->
    <div v-if="showWorkflowCreator" class="modal-overlay" @click="showWorkflowCreator = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Create New Workflow</h2>
          <button @click="showWorkflowCreator = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <WorkflowCreator @workflow-created="onWorkflowCreated" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useOrchestrationStore } from '@/stores/orchestration';
import type { BusinessProcess, WorkflowDefinition } from '@/types';
import WorkflowCreator from './WorkflowCreator.vue';

const emit = defineEmits<{
  'process-created': [process: BusinessProcess]
}>();

const orchestrationStore = useOrchestrationStore();

// Component state
const showWorkflowCreator = ref(false);
const selectedTemplate = ref<string | null>(null);

// Form data
const businessProcess = ref<Omit<BusinessProcess, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>>({
  name: '',
  description: '',
  category: 'custom',
  workflowId: '',
  isActive: true,
  configuration: {}
});

// Configuration items for dynamic config editing
interface ConfigItem {
  key: string;
  value: any;
  type: 'text' | 'number' | 'boolean' | 'email' | 'url';
  description: string;
}

const configItems = ref<ConfigItem[]>([]);

// Computed properties
const availableWorkflows = computed(() => orchestrationStore.workflows);

const selectedWorkflow = computed(() => {
  return availableWorkflows.value.find(w => w.id === businessProcess.value.workflowId);
});

const isFormValid = computed(() => {
  return businessProcess.value.name.trim() !== '' &&
         businessProcess.value.description.trim() !== '' &&
         businessProcess.value.workflowId !== '';
});

// Configuration presets
const configPresets = [
  {
    name: 'Customer Service',
    config: {
      'priority_levels': ['low', 'medium', 'high', 'urgent'],
      'auto_assign': true,
      'response_time_sla': 24,
      'escalation_threshold': 48,
      'notification_email': 'support@company.com'
    }
  },
  {
    name: 'Content Creation',
    config: {
      'content_types': ['blog', 'social', 'email', 'documentation'],
      'approval_required': true,
      'publish_automatically': false,
      'seo_optimization': true,
      'brand_guidelines_check': true
    }
  },
  {
    name: 'Data Analysis',
    config: {
      'data_sources': ['database', 'api', 'file_upload'],
      'analysis_frequency': 'daily',
      'report_format': 'pdf',
      'stakeholder_emails': ['manager@company.com'],
      'threshold_alerts': true
    }
  },
  {
    name: 'Sales Pipeline',
    config: {
      'lead_scoring': true,
      'auto_follow_up': true,
      'follow_up_intervals': [1, 3, 7, 14, 30],
      'qualification_criteria': ['budget', 'authority', 'need', 'timeline'],
      'crm_integration': true
    }
  }
];

// Process templates
const processTemplates = [
  {
    name: 'Customer Support Automation',
    category: 'support_ticket',
    description: 'Fully automated customer support ticket processing with intelligent routing and response generation.',
    features: ['AI Analysis', 'Auto-routing', 'Response Generation', 'Escalation Management'],
    config: {
      'ticket_categories': ['technical', 'billing', 'general'],
      'auto_close_threshold': 72,
      'satisfaction_survey': true,
      'knowledge_base_integration': true
    }
  },
  {
    name: 'Content Marketing Pipeline',
    category: 'content_pipeline',
    description: 'End-to-end content creation workflow from ideation to publication.',
    features: ['Topic Research', 'Content Creation', 'Review Process', 'SEO Optimization', 'Publishing'],
    config: {
      'content_calendar': true,
      'social_media_distribution': true,
      'analytics_tracking': true,
      'competitor_analysis': true
    }
  },
  {
    name: 'Customer Onboarding',
    category: 'customer_onboarding',
    description: 'Streamlined customer onboarding process with automated welcome sequences and setup assistance.',
    features: ['Welcome Email', 'Account Setup', 'Tutorial Delivery', 'Check-in Calls', 'Success Metrics'],
    config: {
      'welcome_email_delay': 0,
      'tutorial_progression': 'guided',
      'checkin_schedule': [1, 7, 30],
      'success_metrics': ['login_frequency', 'feature_adoption']
    }
  },
  {
    name: 'Business Intelligence Reports',
    category: 'data_analysis',
    description: 'Automated business intelligence reporting with data collection, analysis, and distribution.',
    features: ['Data Collection', 'Statistical Analysis', 'Visualization', 'Report Generation', 'Distribution'],
    config: {
      'report_frequency': 'weekly',
      'data_retention': 365,
      'visualization_types': ['charts', 'tables', 'dashboards'],
      'export_formats': ['pdf', 'excel', 'html']
    }
  }
];

// Methods
function applyPreset(preset: any) {
  configItems.value = Object.entries(preset.config).map(([key, value]) => ({
    key,
    value,
    type: typeof value === 'number' ? 'number' : 
          typeof value === 'boolean' ? 'boolean' :
          Array.isArray(value) ? 'text' : 'text',
    description: ''
  }));
  
  updateConfiguration();
}

function applyTemplate(template: any) {
  selectedTemplate.value = template.name;
  businessProcess.value.name = template.name;
  businessProcess.value.description = template.description;
  businessProcess.value.category = template.category;
  
  // Apply template configuration
  configItems.value = Object.entries(template.config).map(([key, value]) => ({
    key,
    value,
    type: typeof value === 'number' ? 'number' : 
          typeof value === 'boolean' ? 'boolean' :
          Array.isArray(value) ? 'text' : 'text',
    description: ''
  }));
  
  updateConfiguration();
}

function addConfigItem() {
  configItems.value.push({
    key: '',
    value: '',
    type: 'text',
    description: ''
  });
}

function removeConfigItem(index: number) {
  configItems.value.splice(index, 1);
  updateConfiguration();
}

function updateConfiguration() {
  const config: Record<string, any> = {};
  
  configItems.value.forEach(item => {
    if (item.key.trim()) {
      config[item.key] = item.value;
    }
  });
  
  businessProcess.value.configuration = config;
}

async function createBusinessProcess() {
  try {
    updateConfiguration();
    
    const createdProcess = await orchestrationStore.createBusinessProcess(businessProcess.value);
    
    emit('process-created', createdProcess);
    resetForm();
  } catch (error) {
    console.error('Error creating business process:', error);
  }
}

function resetForm() {
  businessProcess.value = {
    name: '',
    description: '',
    category: 'custom',
    workflowId: '',
    isActive: true,
    configuration: {}
  };
  
  configItems.value = [];
  selectedTemplate.value = null;
}

function onWorkflowCreated(workflow: WorkflowDefinition) {
  showWorkflowCreator.value = false;
  businessProcess.value.workflowId = workflow.id;
}

// Watch for config changes
import { watch } from 'vue';

watch(configItems, updateConfiguration, { deep: true });
</script>

<style scoped>
.business-process-creator {
  max-width: 900px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.form-section h3 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.workflow-selection {
  space-y: 1rem;
}

.workflow-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
}

.workflow-preview h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.workflow-preview p {
  margin: 0 0 1rem 0;
  color: #6b7280;
}

.workflow-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.meta-badge {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.create-new-workflow {
  margin-top: 1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  text-align: center;
}

.create-new-workflow p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
}

.config-editor {
  space-y: 1.5rem;
}

.config-presets h4,
.config-form h4 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.preset-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.config-form {
  margin-top: 1.5rem;
}

.config-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f9fafb;
}

.config-item-header {
  display: grid;
  grid-template-columns: 1fr 120px 40px;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.config-key,
.config-type {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.config-item-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.config-value,
.config-description {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.template-selector {
  margin-top: 1rem;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.template-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.template-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-card.active {
  border-color: #4f46e5;
  background: #f0f9ff;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
}

.template-header h4 {
  margin: 0;
  color: #374151;
}

.template-category {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.template-description {
  color: #6b7280;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
}

.template-features {
  margin-top: 1rem;
}

.feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.feature-tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 900px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

/* Button Styles */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
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

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #374151;
}

.btn-success {
  background: #059669;
  color: white;
}

.btn-success:hover {
  background: #047857;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-outline {
  background: transparent;
  color: #4f46e5;
  border: 1px solid #4f46e5;
}

.btn-outline:hover {
  background: #4f46e5;
  color: white;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}
</style>