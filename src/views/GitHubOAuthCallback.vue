<template>
  <div class="oauth-callback">
    <div class="callback-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <h2>Connecting to GitHub...</h2>
        <p>Please wait while we complete the authentication process.</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h2>Authentication Failed</h2>
        <p class="error-message">{{ error }}</p>
        <button @click="goBack" class="btn-primary">
          Return to MCP Manager
        </button>
      </div>

      <div v-else-if="success" class="success-state">
        <div class="success-icon">✅</div>
        <h2>Successfully Connected to GitHub!</h2>
        <p>Your GitHub account is now connected via OAuth.</p>
        <button @click="goBack" class="btn-primary">
          Continue to MCP Manager
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { GitHubMCPService } from '@/services/github-mcp'
import { useAgentStore } from '@/stores/agents'

const router = useRouter()
const route = useRoute()
const agentStore = useAgentStore()

const loading = ref(true)
const error = ref('')
const success = ref(false)

const githubMCP = new GitHubMCPService()

onMounted(async () => {
  try {
    // Get the authorization code and state from URL parameters
    const code = route.query.code as string
    const state = route.query.state as string
    const errorParam = route.query.error as string

    // Check if user denied authorization
    if (errorParam) {
      throw new Error(`GitHub authorization failed: ${errorParam}`)
    }

    // Check if we have the required parameters
    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter')
    }

    // Exchange the code for an access token
    const accessToken = await githubMCP.exchangeCodeForToken(code, state)
    
    if (!accessToken) {
      throw new Error('Failed to exchange authorization code for access token')
    }

    // Connect to GitHub using the OAuth token
    const connected = await githubMCP.connectToGitHubOAuth(accessToken)
    
    if (!connected) {
      throw new Error('Failed to establish GitHub connection with OAuth token')
    }

    // Add the GitHub MCP endpoint to the agent store
    agentStore.addMCPEndpoint({
      name: 'GitHub Integration (OAuth)',
      url: 'https://api.github.com',
      type: 'api_gateway',
      auth: {
        type: 'oauth',
        credentials: { 
          accessToken: accessToken,
          authMethod: 'oauth'
        }
      },
      capabilities: [
        'repository_list',
        'file_read',
        'file_write',
        'commit_history',
        'branch_management',
        'issue_management',
        'readme_access'
      ],
      isActive: true
    })

    success.value = true
    
    // Automatically redirect after a delay
    setTimeout(() => {
      goBack()
    }, 3000)

  } catch (err) {
    console.error('OAuth callback error:', err)
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
})

function goBack() {
  router.push('/mcp')
}
</script>

<style scoped>
.oauth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.callback-content {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.loading-state,
.error-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.8rem;
}

p {
  margin: 0 0 2rem 0;
  color: #666;
  line-height: 1.6;
}

.error-message {
  color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #dc3545;
  margin-bottom: 2rem;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

@media (max-width: 600px) {
  .callback-content {
    padding: 2rem;
    margin: 10px;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}
</style>