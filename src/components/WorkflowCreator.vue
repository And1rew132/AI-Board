<template>
  <div class="workflow-creator">
    <form @submit.prevent="createWorkflow">
      <!-- Basic Information -->
      <div class="form-section">
        <h3>Basic Information</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="name">Workflow Name</label>
            <input
              id="name"
              v-model="workflow.name"
              type="text"
              required
              placeholder="e.g., Customer Onboarding Process"
            />
          </div>
          
          <div class="form-group">
            <label for="type">Workflow Type</label>
            <select id="type" v-model="workflow.type" required>
              <option value="customer_service">Customer Service</option>
              <option value="content_creation">Content Creation</option>
              <option value="data_analysis">Data Analysis</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="category">Category</label>
            <select id="category" v-model="workflow.category" required>
              <option value="sales">Sales</option>
              <option value="marketing">Marketing</option>
              <option value="support">Support</option>
              <option value="operations">Operations</option>
              <option value="finance">Finance</option>
              <option value="hr">HR</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="workflow.description"
            rows="3"
            placeholder="Describe what this workflow does and its purpose..."
          ></textarea>
        </div>
      </div>

      <!-- Workflow Steps -->
      <div class="form-section">
        <div class="section-header">
          <h3>Workflow Steps</h3>
          <button type="button" @click="addStep" class="btn btn-sm btn-success">
            ➕ Add Step
          </button>
        </div>
        
        <div class="steps-container">
          <div 
            v-for="(step, index) in workflow.steps" 
            :key="step.id"
            class="step-card"
          >
            <div class="step-header">
              <span class="step-number">{{ index + 1 }}</span>
              <input
                v-model="step.name"
                type="text"
                placeholder="Step name"
                class="step-name-input"
              />
              <button
                type="button"
                @click="removeStep(index)"
                class="btn btn-sm btn-danger"
              >
                🗑️
              </button>
            </div>
            
            <div class="step-content">
              <div class="form-grid">
                <div class="form-group">
                  <label>Step Type</label>
                  <select v-model="step.type">
                    <option value="agent_task">Agent Task</option>
                    <option value="human_approval">Human Approval</option>
                    <option value="condition">Condition</option>
                    <option value="data_transform">Data Transform</option>
                    <option value="external_api">External API</option>
                  </select>
                </div>
                
                <div class="form-group" v-if="step.type === 'agent_task'">
                  <label>Required Role/Capability</label>
                  <input
                    v-model="step.agentRole"
                    type="text"
                    placeholder="e.g., code_generation, analysis"
                  />
                </div>
              </div>
              
              <div class="form-group">
                <label>Description</label>
                <textarea
                  v-model="step.description"
                  rows="2"
                  placeholder="Describe what this step does..."
                ></textarea>
              </div>
              
              <div class="form-group">
                <label>Dependencies (Previous Steps)</label>
                <div class="dependencies-selector">
                  <label 
                    v-for="(dep, depIndex) in workflow.steps.slice(0, index)" 
                    :key="dep.id"
                    class="dependency-checkbox"
                  >
                    <input
                      type="checkbox"
                      :value="dep.id"
                      v-model="step.dependencies"
                    />
                    {{ dep.name || `Step ${depIndex + 1}` }}
                  </label>
                </div>
              </div>
              
              <!-- Agent Task Configuration -->
              <div v-if="step.type === 'agent_task'" class="step-config">
                <h4>Agent Task Configuration</h4>
                <div class="form-group">
                  <label>Required Capabilities (comma-separated)</label>
                  <input
                    :value="step.config.requiredCapabilities?.join(', ')"
                    @input="updateRequiredCapabilities(step, $event)"
                    type="text"
                    placeholder="e.g., code_generation, content_creation"
                  />
                </div>
                <div class="form-group">
                  <label>Prompt Template</label>
                  <textarea
                    v-model="step.config.prompt"
                    rows="3"
                    placeholder="Prompt template for the agent..."
                  ></textarea>
                </div>
              </div>
              
              <!-- Condition Configuration -->
              <div v-if="step.type === 'condition'" class="step-config">
                <h4>Condition Configuration</h4>
                <div 
                  v-for="(condition, condIndex) in step.conditions" 
                  :key="condIndex"
                  class="condition-row"
                >
                  <div class="form-grid">
                    <input
                      v-model="condition.field"
                      type="text"
                      placeholder="Field name"
                    />
                    <select v-model="condition.operator">
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="exists">Exists</option>
                    </select>
                    <input
                      v-model="condition.value"
                      type="text"
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      @click="removeCondition(step, condIndex)"
                      class="btn btn-sm btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  @click="addCondition(step)"
                  class="btn btn-sm btn-secondary"
                >
                  Add Condition
                </button>
              </div>
              
              <!-- External API Configuration -->
              <div v-if="step.type === 'external_api'" class="step-config">
                <h4>External API Configuration</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label>URL</label>
                    <input
                      :value="step.config.externalApiConfig?.url || ''"
                      @input="updateExternalApiUrl(step, $event)"
                      type="url"
                      placeholder="https://api.example.com/endpoint"
                    />
                  </div>
                  <div class="form-group">
                    <label>Method</label>
                    <select 
                      :value="step.config.externalApiConfig?.method || 'GET'"
                      @change="updateExternalApiMethod(step, $event)"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <!-- Human Approval Configuration -->
              <div v-if="step.type === 'human_approval'" class="step-config">
                <h4>Human Approval Configuration</h4>
                <div class="form-group">
                  <label>Approvers (comma-separated)</label>
                  <input
                    :value="step.config.approvers?.join(', ')"
                    @input="updateApprovers(step, $event)"
                    type="text"
                    placeholder="e.g., manager@company.com, admin@company.com"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="workflow.steps.length === 0" class="empty-steps">
            <p>No steps added yet. Click "Add Step" to create your first step.</p>
          </div>
        </div>
      </div>

      <!-- Triggers -->
      <div class="form-section">
        <div class="section-header">
          <h3>Workflow Triggers</h3>
          <button type="button" @click="addTrigger" class="btn btn-sm btn-success">
            ➕ Add Trigger
          </button>
        </div>
        
        <div class="triggers-container">
          <div 
            v-for="(trigger, index) in workflow.triggers" 
            :key="trigger.id"
            class="trigger-card"
          >
            <div class="trigger-header">
              <select v-model="trigger.type">
                <option value="manual">Manual</option>
                <option value="schedule">Schedule</option>
                <option value="event">Event</option>
                <option value="webhook">Webhook</option>
                <option value="file_upload">File Upload</option>
              </select>
              <button
                type="button"
                @click="removeTrigger(index)"
                class="btn btn-sm btn-danger"
              >
                🗑️
              </button>
            </div>
            
            <div class="trigger-config">
              <div v-if="trigger.type === 'schedule'" class="form-group">
                <label>Cron Schedule</label>
                <input
                  v-model="trigger.config.schedule"
                  type="text"
                  placeholder="0 9 * * MON (Every Monday at 9 AM)"
                />
              </div>
              
              <div v-if="trigger.type === 'webhook'" class="form-group">
                <label>Webhook URL</label>
                <input
                  v-model="trigger.config.webhookUrl"
                  type="text"
                  placeholder="/webhooks/workflow-trigger"
                />
              </div>
              
              <div v-if="trigger.type === 'event'" class="form-group">
                <label>Event Type</label>
                <input
                  v-model="trigger.config.eventType"
                  type="text"
                  placeholder="customer_created, order_completed, etc."
                />
              </div>
            </div>
          </div>
          
          <div v-if="workflow.triggers.length === 0" class="empty-triggers">
            <p>No triggers configured. Add triggers to define when this workflow should run.</p>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="resetForm" class="btn btn-secondary">
          Reset
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!isFormValid">
          Create Workflow
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useOrchestrationStore } from '@/stores/orchestration';
import type { WorkflowDefinition, WorkflowStep, WorkflowTrigger, WorkflowCondition } from '@/types';

const emit = defineEmits<{
  'workflow-created': [workflow: WorkflowDefinition]
}>();

const orchestrationStore = useOrchestrationStore();

// Form data
const workflow = ref<Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
  name: '',
  description: '',
  type: 'custom',
  category: 'general',
  steps: [],
  triggers: [],
  isActive: true,
  isTemplate: false
});

// Computed
const isFormValid = computed(() => {
  return workflow.value.name.trim() !== '' &&
         workflow.value.description.trim() !== '' &&
         workflow.value.steps.length > 0;
});

// Step management
function addStep() {
  const step: WorkflowStep = {
    id: generateId(),
    name: '',
    type: 'agent_task',
    description: '',
    config: {},
    dependencies: [],
    conditions: []
  };
  
  workflow.value.steps.push(step);
}

function removeStep(index: number) {
  const stepId = workflow.value.steps[index].id;
  workflow.value.steps.splice(index, 1);
  
  // Remove this step from dependencies of other steps
  workflow.value.steps.forEach(step => {
    step.dependencies = step.dependencies.filter(dep => dep !== stepId);
  });
}

function addCondition(step: WorkflowStep) {
  if (!step.conditions) {
    step.conditions = [];
  }
  
  const condition: WorkflowCondition = {
    field: '',
    operator: 'equals',
    value: ''
  };
  
  step.conditions.push(condition);
}

function removeCondition(step: WorkflowStep, index: number) {
  if (step.conditions) {
    step.conditions.splice(index, 1);
  }
}

// Trigger management
function addTrigger() {
  const trigger: WorkflowTrigger = {
    id: generateId(),
    type: 'manual',
    config: {},
    isActive: true
  };
  
  workflow.value.triggers.push(trigger);
}

function removeTrigger(index: number) {
  workflow.value.triggers.splice(index, 1);
}

// Helper functions
function updateRequiredCapabilities(step: WorkflowStep, event: Event) {
  const target = event.target as HTMLInputElement;
  const capabilities = target.value.split(',').map(s => s.trim()).filter(s => s);
  
  if (!step.config) step.config = {};
  step.config.requiredCapabilities = capabilities;
}

function updateApprovers(step: WorkflowStep, event: Event) {
  const target = event.target as HTMLInputElement;
  const approvers = target.value.split(',').map(s => s.trim()).filter(s => s);
  
  if (!step.config) step.config = {};
  step.config.approvers = approvers;
}

function updateExternalApiUrl(step: WorkflowStep, event: Event) {
  const target = event.target as HTMLInputElement;
  
  if (!step.config) step.config = {};
  if (!step.config.externalApiConfig) {
    step.config.externalApiConfig = { url: '', method: 'GET' };
  }
  step.config.externalApiConfig.url = target.value;
}

function updateExternalApiMethod(step: WorkflowStep, event: Event) {
  const target = event.target as HTMLSelectElement;
  
  if (!step.config) step.config = {};
  if (!step.config.externalApiConfig) {
    step.config.externalApiConfig = { url: '', method: 'GET' };
  }
  step.config.externalApiConfig.method = target.value;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Form actions
async function createWorkflow() {
  try {
    const createdWorkflow = await orchestrationStore.createWorkflow({
      ...workflow.value,
      createdBy: 'user'
    });
    
    emit('workflow-created', createdWorkflow);
    resetForm();
  } catch (error) {
    console.error('Error creating workflow:', error);
  }
}

function resetForm() {
  workflow.value = {
    name: '',
    description: '',
    type: 'custom',
    category: 'general',
    steps: [],
    triggers: [],
    isActive: true,
    isTemplate: false
  };
}

// Initialize with default configuration for certain step types
function initializeStepConfig(step: WorkflowStep) {
  switch (step.type) {
    case 'external_api':
      step.config.externalApiConfig = {
        url: '',
        method: 'GET'
      };
      break;
    case 'agent_task':
      step.config.requiredCapabilities = [];
      break;
    case 'human_approval':
      step.config.approvers = [];
      break;
  }
}

// Watch for step type changes to initialize config
import { watch } from 'vue';

workflow.value.steps.forEach(step => {
  watch(() => step.type, () => {
    initializeStepConfig(step);
  });
});
</script>

<style scoped>
.workflow-creator {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #374151;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.steps-container {
  space-y: 1rem;
}

.step-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f9fafb;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.step-number {
  background: #4f46e5;
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-name-input {
  flex: 1;
  font-weight: 500;
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.step-content {
  margin-left: 3rem;
}

.step-config {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.step-config h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1rem;
}

.dependencies-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dependency-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.dependency-checkbox input {
  width: auto;
  margin: 0;
}

.condition-row {
  margin-bottom: 0.5rem;
}

.condition-row .form-grid {
  grid-template-columns: 1fr 120px 1fr 80px;
  align-items: end;
}

.triggers-container {
  space-y: 1rem;
}

.trigger-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f9fafb;
}

.trigger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.trigger-config {
  margin-top: 1rem;
}

.empty-steps,
.empty-triggers {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
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

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}
</style>