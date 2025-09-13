# Issue: Enhance Security and Configuration Management

## Priority: High

## Description
The application currently stores sensitive data like API keys in localStorage, which poses security risks. We need to implement proper secret management and secure configuration handling.

## Current Security Issues
- OpenAI API keys stored in localStorage (client-side accessible)
- No environment variable validation
- No secure credential storage
- Sensitive data exposed in browser dev tools
- No API key rotation mechanism
- Missing security headers

## Proposed Solution

### 1. Environment Variable Management
Create `.env.example`:
```env
# OpenAI Configuration
VITE_OPENAI_ENABLED=true

# Storage Configuration  
VITE_STORAGE_PROVIDER=local
VITE_MINIO_ENDPOINT=http://localhost:9000
VITE_MINIO_BUCKET=ai-board

# GitHub MCP
VITE_GITHUB_MCP_ENABLED=true

# Security
VITE_ENABLE_DEBUG=false
VITE_API_TIMEOUT=30000

# Do not commit these files:
# .env.local
# .env.development.local
# .env.production.local
```

Create `src/config/environment.ts`:
```typescript
interface AppConfig {
  openai: {
    enabled: boolean
  }
  storage: {
    provider: string
    minio: {
      endpoint: string
      bucket: string
    }
  }
  github: {
    mcpEnabled: boolean
  }
  api: {
    timeout: number
  }
  debug: boolean
}

function validateEnvVar(name: string, value: string | undefined, required = true): string {
  if (required && !value) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value || ''
}

export const config: AppConfig = {
  openai: {
    enabled: validateEnvVar('VITE_OPENAI_ENABLED', import.meta.env.VITE_OPENAI_ENABLED) === 'true'
  },
  storage: {
    provider: validateEnvVar('VITE_STORAGE_PROVIDER', import.meta.env.VITE_STORAGE_PROVIDER, false) || 'local',
    minio: {
      endpoint: validateEnvVar('VITE_MINIO_ENDPOINT', import.meta.env.VITE_MINIO_ENDPOINT, false),
      bucket: validateEnvVar('VITE_MINIO_BUCKET', import.meta.env.VITE_MINIO_BUCKET, false)
    }
  },
  github: {
    mcpEnabled: validateEnvVar('VITE_GITHUB_MCP_ENABLED', import.meta.env.VITE_GITHUB_MCP_ENABLED) === 'true'
  },
  api: {
    timeout: parseInt(validateEnvVar('VITE_API_TIMEOUT', import.meta.env.VITE_API_TIMEOUT, false) || '30000')
  },
  debug: validateEnvVar('VITE_ENABLE_DEBUG', import.meta.env.VITE_ENABLE_DEBUG) === 'true'
}
```

### 2. Secure Credential Management
Create `src/services/security.ts`:
```typescript
interface SecureStorage {
  setCredential(key: string, value: string): Promise<void>
  getCredential(key: string): Promise<string | null>
  removeCredential(key: string): Promise<void>
  hasCredential(key: string): Promise<boolean>
}

class BrowserSecureStorage implements SecureStorage {
  private prefix = 'ai-board-secure:'

  async setCredential(key: string, value: string): Promise<void> {
    // In a real implementation, this would encrypt the value
    // For now, we'll use sessionStorage which is more secure than localStorage
    sessionStorage.setItem(this.prefix + key, this.encrypt(value))
  }

  async getCredential(key: string): Promise<string | null> {
    const encrypted = sessionStorage.getItem(this.prefix + key)
    return encrypted ? this.decrypt(encrypted) : null
  }

  async removeCredential(key: string): Promise<void> {
    sessionStorage.removeItem(this.prefix + key)
  }

  async hasCredential(key: string): Promise<boolean> {
    return sessionStorage.getItem(this.prefix + key) !== null
  }

  private encrypt(value: string): string {
    // Simple base64 encoding for now
    // In production, use proper encryption like Web Crypto API
    return btoa(value)
  }

  private decrypt(encrypted: string): string {
    try {
      return atob(encrypted)
    } catch {
      return ''
    }
  }
}

export const secureStorage = new BrowserSecureStorage()

// Credential manager
export class CredentialManager {
  private static instance: CredentialManager
  private storage: SecureStorage

  private constructor() {
    this.storage = secureStorage
  }

  static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager()
    }
    return CredentialManager.instance
  }

  async setOpenAIKey(apiKey: string): Promise<void> {
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key format')
    }
    await this.storage.setCredential('openai-key', apiKey)
  }

  async getOpenAIKey(): Promise<string | null> {
    return await this.storage.getCredential('openai-key')
  }

  async removeOpenAIKey(): Promise<void> {
    await this.storage.removeCredential('openai-key')
  }

  async hasOpenAIKey(): Promise<boolean> {
    return await this.storage.hasCredential('openai-key')
  }

  // Add methods for other credentials (GitHub tokens, storage keys, etc.)
  async setGitHubToken(token: string): Promise<void> {
    await this.storage.setCredential('github-token', token)
  }

  async getGitHubToken(): Promise<string | null> {
    return await this.storage.getCredential('github-token')
  }

  async setStorageCredentials(accessKey: string, secretKey: string): Promise<void> {
    await this.storage.setCredential('storage-access-key', accessKey)
    await this.storage.setCredential('storage-secret-key', secretKey)
  }

  async getStorageCredentials(): Promise<{ accessKey: string; secretKey: string } | null> {
    const accessKey = await this.storage.getCredential('storage-access-key')
    const secretKey = await this.storage.getCredential('storage-secret-key')
    
    if (!accessKey || !secretKey) return null
    
    return { accessKey, secretKey }
  }

  async clearAllCredentials(): Promise<void> {
    await this.removeOpenAIKey()
    await this.storage.removeCredential('github-token')
    await this.storage.removeCredential('storage-access-key')
    await this.storage.removeCredential('storage-secret-key')
  }
}
```

### 3. Update OpenAI Service to Use Secure Storage
Update `src/services/openai.ts`:
```typescript
import { CredentialManager } from './security'

export class OpenAIService {
  private credentialManager = CredentialManager.getInstance()

  async configure(config: Omit<OpenAIConfig, 'apiKey'> & { apiKey?: string }): Promise<void> {
    try {
      // Store API key securely if provided
      if (config.apiKey) {
        await this.credentialManager.setOpenAIKey(config.apiKey)
      }

      // Get API key from secure storage
      const apiKey = await this.credentialManager.getOpenAIKey()
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please configure your API key.')
      }

      this.config = { ...config, apiKey }
      this.client = new OpenAI({
        apiKey,
        organization: config.organization,
        dangerouslyAllowBrowser: true
      })

      // Save non-sensitive config to localStorage
      const configToSave = { ...config }
      delete configToSave.apiKey
      localStorage.setItem('openai-config', JSON.stringify(configToSave))
      
    } catch (error) {
      console.error('Failed to configure OpenAI:', error)
      throw new Error('Failed to configure OpenAI client')
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = localStorage.getItem('openai-config')
      const hasApiKey = await this.credentialManager.hasOpenAIKey()
      
      if (savedConfig && hasApiKey) {
        const config = JSON.parse(savedConfig)
        await this.configure(config)
      }
    } catch (error) {
      console.warn('Failed to load OpenAI config:', error)
    }
  }

  async disconnect(): Promise<void> {
    this.client = null
    this.config = null
    localStorage.removeItem('openai-config')
    await this.credentialManager.removeOpenAIKey()
  }
}
```

### 4. Add Security Headers and CSP
Update `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Security Headers -->
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
    
    <!-- Content Security Policy -->
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https:;
      connect-src 'self' https://api.openai.com https://api.github.com;
      font-src 'self';
      object-src 'none';
      frame-src 'none';
    ">
    
    <title>AI Board</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### 5. Input Validation and Sanitization
Create `src/utils/validation.ts`:
```typescript
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false
  
  // OpenAI API keys start with 'sk-' and are typically 51 characters
  const openAIPattern = /^sk-[a-zA-Z0-9]{48}$/
  
  return openAIPattern.test(apiKey)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML
    .trim()
    .slice(0, 1000) // Limit length
}

export function validateProjectName(name: string): void {
  if (!name || name.length < 2) {
    throw new ValidationError('Project name must be at least 2 characters', 'name')
  }
  if (name.length > 100) {
    throw new ValidationError('Project name must be less than 100 characters', 'name')
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    throw new ValidationError('Project name contains invalid characters', 'name')
  }
}

export function validateAgentName(name: string): void {
  if (!name || name.length < 2) {
    throw new ValidationError('Agent name must be at least 2 characters', 'name')
  }
  if (name.length > 50) {
    throw new ValidationError('Agent name must be less than 50 characters', 'name')
  }
}
```

### 6. Update .gitignore for Security
Add to `.gitignore`:
```gitignore
# Environment files
.env.local
.env.development.local
.env.production.local
.env

# Security
*.key
*.pem
*.p12
*.pfx
secrets/
credentials/

# Logs that might contain sensitive data
*.log
logs/
```

## Benefits
- Improved security posture
- Proper credential management
- Environment-specific configuration
- Input validation and sanitization
- Security headers protection
- Reduced attack surface

## Security Improvements
- API keys no longer stored in localStorage
- Environment variable validation
- Input sanitization
- CSP headers for XSS protection
- Secure session storage usage
- Credential rotation support

## Acceptance Criteria
- [ ] Environment variable management implemented
- [ ] Secure credential storage system created
- [ ] OpenAI service updated to use secure storage
- [ ] Input validation implemented
- [ ] Security headers added
- [ ] .gitignore updated for security
- [ ] Migration guide for existing users
- [ ] Security documentation added
- [ ] Penetration testing performed

## Breaking Changes
- Users will need to re-enter their API keys
- Existing localStorage credentials will be migrated on first load

## Estimated Effort
Large (10-14 hours)