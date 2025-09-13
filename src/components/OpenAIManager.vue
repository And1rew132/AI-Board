<template>
  <div class="openai-manager">
    <div class="header">
      <h3>OpenAI Integration</h3>
      <div class="status-indicator" :class="{ connected: isConnected, connecting: isConnecting }">
        <span class="status-dot"></span>
        {{ connectionStatus }}
      </div>
    </div>

    <!-- Configuration Form -->
    <div v-if="!isConnected" class="config-form">
      <div class="form-group">
        <label for="apiKey">API Key</label>
        <div class="input-group">
          <input
            id="apiKey"
            v-model="config.apiKey"
            :type="showApiKey ? 'text' : 'password'"
            placeholder="sk-..."
            class="api-key-input"
          />
          <button 
            type="button" 
            @click="toggleApiKeyVisibility"
            class="toggle-visibility"
          >
            {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
      </div>

      <div class="form-group">
        <label for="organization">Organization ID (Optional)</label>
        <input
          id="organization"
          v-model="config.organization"
          type="text"
          placeholder="org-..."
        />
      </div>

      <div class="form-group">
        <label for="defaultModel">Default Model</label>
        <select id="defaultModel" v-model="config.defaultModel">
          <option v-for="model in availableModels" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="maxTokens">Max Tokens</label>
          <input
            id="maxTokens"
            v-model.number="config.maxTokens"
            type="number"
            min="1"
            max="4096"
          />
        </div>

        <div class="form-group">
          <label for="temperature">Temperature</label>
          <input
            id="temperature"
            v-model.number="config.temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
          />
        </div>
      </div>

      <div class="actions">
        <button @click="testConnection" :disabled="!config.apiKey || isConnecting" class="test-btn">
          {{ isConnecting ? 'Testing...' : 'Test Connection' }}
        </button>
        <button @click="connect" :disabled="!config.apiKey || isConnecting" class="connect-btn">
          Connect
        </button>
      </div>
    </div>

    <!-- Connected State -->
    <div v-else class="connected-state">
      <div class="connection-info">
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

      <div class="actions">
        <button @click="disconnect" class="disconnect-btn">
          Disconnect
        </button>
        <button @click="showTestChat = true" class="test-chat-btn">
          Test Chat
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
  padding: 20px;
  max-width: 800px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h3 {
  margin: 0;
  color: #333;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: #f0f0f0;
  font-size: 14px;
}

.status-indicator.connected {
  background: #e7f5e7;
  color: #2d6a2d;
}

.status-indicator.connecting {
  background: #fff3cd;
  color: #856404;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.connected .status-dot {
  background: #28a745;
}

.connecting .status-dot {
  background: #ffc107;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.config-form {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.input-group {
  display: flex;
  align-items: center;
}

.api-key-input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.toggle-visibility {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-left: none;
  background: #f8f9fa;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn {
  background: #6c757d;
  color: white;
}

.connect-btn {
  background: #007bff;
  color: white;
}

.disconnect-btn {
  background: #dc3545;
  color: white;
}

.test-chat-btn {
  background: #28a745;
  color: white;
}

.actions button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.connected-state {
  background: #e7f5e7;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #c3e6c3;
}

.connection-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #2d6a2d;
}

.info-item .value {
  color: #333;
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