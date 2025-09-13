<template>
  <div class="openai-manager">
    <div class="section-header">
      <div class="header-content">
        <h3>OpenAI Integration</h3>
        <p class="section-description">Connect to OpenAI's API for AI-powered capabilities</p>
      </div>
      <div class="status-indicator" :class="{ 
        connected: isConnected, 
        connecting: isConnecting,
        disconnected: !isConnected && !isConnecting 
      }">
        <span class="status-icon" :aria-label="connectionStatus">
          {{ isConnected ? '🟢' : isConnecting ? '🟡' : '🔴' }}
        </span>
        <div class="status-info">
          <span class="status-text">{{ connectionStatus }}</span>
        </div>
      </div>
    </div>

    <!-- Configuration Form -->
    <div v-if="!isConnected" class="config-form">
      <div class="form-header">
        <h4>Connect to OpenAI</h4>
        <p class="form-description">Configure your OpenAI API connection for AI-powered features</p>
      </div>
      
      <form @submit.prevent="connect" novalidate>
        <div class="form-group">
          <label for="apiKey" class="form-label">
            API Key <span class="required">*</span>
          </label>
          <div class="input-group">
            <input
              id="apiKey"
              v-model="config.apiKey"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="sk-..."
              class="form-input"
              :class="{ 'error': !config.apiKey && error }"
              aria-describedby="apiKey-help"
              required
            />
            <button 
              type="button" 
              @click="toggleApiKeyVisibility"
              class="input-addon"
              :aria-label="showApiKey ? 'Hide API key' : 'Show API key'"
            >
              {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <small id="apiKey-help" class="field-help">
            Your OpenAI API key (starts with "sk-")
          </small>
        </div>

        <div class="form-group">
          <label for="organization" class="form-label">Organization ID</label>
          <input
            id="organization"
            v-model="config.organization"
            type="text"
            placeholder="org-..."
            class="form-input"
            aria-describedby="organization-help"
          />
          <small id="organization-help" class="field-help">
            Optional: Your OpenAI organization ID (starts with "org-")
          </small>
        </div>

        <div class="form-group">
          <label for="defaultModel" class="form-label">Default Model</label>
          <select 
            id="defaultModel" 
            v-model="config.defaultModel"
            class="form-select"
            aria-describedby="defaultModel-help"
          >
            <option v-for="model in availableModels" :key="model" :value="model">
              {{ model }}
            </option>
          </select>
          <small id="defaultModel-help" class="field-help">
            Choose the default AI model for your integrations
          </small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="maxTokens" class="form-label">Max Tokens</label>
            <input
              id="maxTokens"
              v-model.number="config.maxTokens"
              type="number"
              min="1"
              max="4096"
              class="form-input"
              aria-describedby="maxTokens-help"
            />
            <small id="maxTokens-help" class="field-help">
              Maximum tokens per request (1-4096)
            </small>
          </div>

          <div class="form-group">
            <label for="temperature" class="form-label">Temperature</label>
            <input
              id="temperature"
              v-model.number="config.temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              class="form-input"
              aria-describedby="temperature-help"
            />
            <small id="temperature-help" class="field-help">
              Creativity level (0.0-2.0)
            </small>
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="button"
            @click="testConnection" 
            :disabled="!config.apiKey || isConnecting" 
            class="btn btn-secondary"
          >
            {{ isConnecting ? 'Testing...' : 'Test Connection' }}
          </button>
          <button 
            type="submit"
            :disabled="!config.apiKey || isConnecting" 
            class="btn btn-primary"
          >
            {{ isConnecting ? 'Connecting...' : 'Connect' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Connected State -->
    <div v-else class="connected-state">
      <div class="connection-info">
        <h4>Connection Active</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Model:</span>
            <span class="value">{{ config.defaultModel }}</span>
          </div>
          <div class="info-item">
            <span class="label">Max Tokens:</span>
            <span class="value">{{ config.maxTokens }}</span>
          </div>
          <div class="info-item">
            <span class="label">Temperature:</span>
            <span class="value">{{ config.temperature }}</span>
          </div>
          <div class="info-item" v-if="config.organization">
            <span class="label">Organization:</span>
            <span class="value">{{ config.organization }}</span>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button @click="showTestChat = true" class="btn btn-primary">
          Test Chat
        </button>
        <button @click="disconnect" class="btn btn-secondary">
          Disconnect
        </button>
      </div>
    </div>

    <!-- Test Chat Modal -->
    <div v-if="showTestChat" class="modal-overlay" @click="closeTestChat">
      <div class="test-chat-modal" @click.stop>
        <div class="modal-header">
          <h4>Test OpenAI Chat</h4>
          <button @click="closeTestChat" class="close-btn">×</button>
        </div>
        <div class="chat-container">
          <div class="messages">
            <div
              v-for="message in testMessages"
              :key="message.id"
              :class="['message', message.role]"
            >
              <div class="message-content">{{ message.content }}</div>
            </div>
            <div v-if="isGenerating" class="message assistant">
              <div class="message-content typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
          <div class="input-area">
            <input
              v-model="testMessage"
              @keyup.enter="sendTestMessage"
              placeholder="Type a message to test OpenAI..."
              :disabled="isGenerating"
            />
            <button @click="sendTestMessage" :disabled="isGenerating || !testMessage.trim()">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Statistics -->
    <div v-if="isConnected && usage" class="usage-stats">
      <h4>Usage Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total Requests</span>
          <span class="stat-value">{{ usage.totalRequests }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Tokens</span>
          <span class="stat-value">{{ usage.totalTokens.toLocaleString() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Estimated Cost</span>
          <span class="stat-value">${{ usage.totalCost.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { openAIService } from '@/services/openai'
import type { OpenAIConfig, ChatMessage } from '@/types'

// Reactive state
const isConnected = ref(false)
const isConnecting = ref(false)
const isGenerating = ref(false)
const showApiKey = ref(false)
const showTestChat = ref(false)
const error = ref('')
const testMessage = ref('')

// Configuration
const config = reactive<OpenAIConfig>({
  apiKey: '',
  organization: '',
  defaultModel: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0
})

// Test chat messages
const testMessages = ref<Array<ChatMessage & { id: string }>>([])

// Usage statistics
const usage = ref({
  totalRequests: 0,
  totalTokens: 0,
  totalCost: 0
})

// Available models
const availableModels = computed(() => openAIService.getAvailableModels())

// Connection status
const connectionStatus = computed(() => {
  if (isConnecting.value) return 'Connecting...'
  if (isConnected.value) return 'Connected'
  return 'Not Connected'
})

// Methods
const toggleApiKeyVisibility = () => {
  showApiKey.value = !showApiKey.value
}

const testConnection = async () => {
  if (!config.apiKey) return

  isConnecting.value = true
  error.value = ''

  try {
    await openAIService.configure(config)
    const isValid = await openAIService.testConnection()
    
    if (isValid) {
      error.value = ''
      alert('Connection successful!')
    } else {
      error.value = 'Connection test failed. Please check your API key.'
    }
  } catch (err: any) {
    error.value = `Connection failed: ${err?.message || 'Unknown error'}`
  } finally {
    isConnecting.value = false
  }
}

const connect = async () => {
  if (!config.apiKey) return

  isConnecting.value = true
  error.value = ''

  try {
    await openAIService.configure(config)
    const isValid = await openAIService.testConnection()
    
    if (isValid) {
      isConnected.value = true
      error.value = ''
      loadUsageStats()
    } else {
      error.value = 'Connection failed. Please check your API key.'
    }
  } catch (err: any) {
    error.value = `Connection failed: ${err?.message || 'Unknown error'}`
  } finally {
    isConnecting.value = false
  }
}

const disconnect = () => {
  openAIService.disconnect()
  isConnected.value = false
  testMessages.value = []
  showTestChat.value = false
  error.value = ''
}

const sendTestMessage = async () => {
  if (!testMessage.value.trim() || isGenerating.value) return

  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    content: testMessage.value
  }

  testMessages.value.push(userMessage)
  const userInput = testMessage.value
  testMessage.value = ''
  isGenerating.value = true

  try {
    const response = await openAIService.chatCompletion([
      { role: 'user', content: userInput }
    ])

    testMessages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content
    })

    // Update usage stats
    if (response.usage) {
      usage.value.totalRequests++
      usage.value.totalTokens += response.usage.totalTokens
      // Rough cost estimation for GPT-4 ($0.03/1K prompt tokens, $0.06/1K completion tokens)
      const promptCost = (response.usage.promptTokens / 1000) * 0.03
      const completionCost = (response.usage.completionTokens / 1000) * 0.06
      usage.value.totalCost += promptCost + completionCost
    }
  } catch (err: any) {
    testMessages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Error: ${err?.message || 'Unknown error'}`
    })
  } finally {
    isGenerating.value = false
  }
}

const closeTestChat = () => {
  showTestChat.value = false
  testMessages.value = []
}

const loadUsageStats = () => {
  // Load usage stats from localStorage or API
  const savedUsage = localStorage.getItem('openai-usage-stats')
  if (savedUsage) {
    usage.value = JSON.parse(savedUsage)
  }
}

const saveUsageStats = () => {
  localStorage.setItem('openai-usage-stats', JSON.stringify(usage.value))
}

// Lifecycle
onMounted(() => {
  const savedConfig = openAIService.getConfig()
  if (savedConfig) {
    Object.assign(config, savedConfig)
    isConnected.value = openAIService.isConfigured()
    if (isConnected.value) {
      loadUsageStats()
    }
  }
})

// Watch for usage changes to save them
watch(() => usage.value, saveUsageStats, { deep: true })
</script>

<style scoped>
.openai-manager {
  padding: 0;
  max-width: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 20px;
}

.header-content h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.section-description {
  margin: 0;
  color: #666;
  font-size: 16px;
  line-height: 1.5;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  min-width: 160px;
  flex-shrink: 0;
}

.status-indicator.connected {
  background: #f0fff4;
  border-color: #9ae6b4;
}

.status-indicator.connecting {
  background: #fffaf0;
  border-color: #fbd38d;
}

.status-indicator.disconnected {
  background: #fff5f5;
  border-color: #feb2b2;
}

.status-icon {
  font-size: 20px;
  line-height: 1;
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.config-form {
  background: #f8f9fa;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.form-header {
  margin-bottom: 32px;
}

.form-header h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.form-description {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
}

.required {
  color: #dc3545;
  font-weight: 500;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: white;
  transition: all 0.2s;
  line-height: 1.4;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input.error {
  border-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.input-group {
  display: flex;
  align-items: stretch;
}

.input-group .form-input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
  flex: 1;
}

.input-addon {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-left: none;
  background: #f8f9fa;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  font-size: 16px;
}

.input-addon:hover {
  background: #e9ecef;
}

.field-help {
  margin-top: 6px;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  align-items: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: none;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  text-decoration: none;
}

.btn:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: 1px solid #007bff;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: 1px solid #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
  border-color: #545b62;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.2);
}

.connected-state {
  background: #f0fff4;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #9ae6b4;
}

.connection-info h4 {
  margin: 0 0 20px 0;
  color: #2d6a2d;
  font-size: 18px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #c3e6c3;
}

.info-item .label {
  font-weight: 600;
  color: #2d6a2d;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

/* Error handling */
.error-message {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-content {
    text-align: center;
  }
  
  .status-indicator {
    align-self: center;
    min-width: auto;
    justify-content: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .config-form,
  .connected-state {
    padding: 20px;
  }
  
  .section-header h3 {
    font-size: 20px;
  }
  
  .section-description {
    font-size: 14px;
  }
  
  .status-indicator {
    padding: 10px 12px;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.test-chat-modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h4 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-height: 300px;
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message.user .message-content {
  background: #007bff;
  color: white;
}

.message.assistant .message-content {
  background: #f1f3f4;
  color: #333;
}

.typing {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite ease-in-out;
}

.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}

.input-area {
  display: flex;
  padding: 16px 20px;
  border-top: 1px solid #eee;
  gap: 12px;
}

.input-area input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.input-area button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.usage-stats {
  margin-top: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.usage-stats h4 {
  margin: 0 0 16px 0;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.error-message {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}
</style>