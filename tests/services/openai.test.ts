import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenAIService } from '@/services/openai'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock OpenAI client
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  }
})

describe('OpenAI Service', () => {
  let service: OpenAIService

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    service = new OpenAIService()
  })

  afterEach(() => {
    service.disconnect()
  })

  it('initializes correctly', () => {
    expect(service.isConfigured()).toBe(false)
    expect(service.getConfig()).toBe(null)
  })

  it('configures correctly with valid config', async () => {
    const config = {
      apiKey: 'test-key',
      defaultModel: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    }
    
    await service.configure(config)
    
    expect(service.isConfigured()).toBe(true)
    expect(service.getConfig()).toEqual(config)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('openai-config', JSON.stringify(config))
    expect(localStorageMock.setItem).toHaveBeenCalledWith('openai-api-key', 'test-key')
  })

  it('loads configuration from localStorage', () => {
    const savedConfig = {
      defaultModel: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    }
    const savedApiKey = 'test-key'

    localStorageMock.getItem
      .mockReturnValueOnce(JSON.stringify(savedConfig))
      .mockReturnValueOnce(savedApiKey)

    // Create new service instance to trigger loadConfig
    const newService = new OpenAIService()
    
    expect(newService.isConfigured()).toBe(true)
    
    // Clean up
    newService.disconnect()
  })

  it('handles localStorage loading errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('Storage error')
    })

    // Should not throw an error
    const newService = new OpenAIService()
    expect(newService.isConfigured()).toBe(false)
    
    // Clean up
    newService.disconnect()
  })

  it('gets available models', () => {
    const models = service.getAvailableModels()
    
    expect(models).toBeInstanceOf(Array)
    expect(models).toContain('gpt-4')
    expect(models).toContain('gpt-3.5-turbo')
    expect(models.length).toBeGreaterThan(0)
  })

  it('disconnects and clears configuration', async () => {
    const config = {
      apiKey: 'test-key',
      defaultModel: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    }
    
    await service.configure(config)
    expect(service.isConfigured()).toBe(true)
    
    service.disconnect()
    
    expect(service.isConfigured()).toBe(false)
    expect(service.getConfig()).toBe(null)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('openai-config')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('openai-api-key')
  })

  it('throws error when trying to use unconfigured client', async () => {
    await expect(service.testConnection()).rejects.toThrow('OpenAI client not configured')
    
    await expect(service.chatCompletion([
      { role: 'user', content: 'test' }
    ])).rejects.toThrow('OpenAI client not configured')
  })

  it('validates configuration during setup', async () => {
    const invalidConfig = {
      apiKey: '',
      defaultModel: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    }
    
    // This should still work as the service doesn't validate the API key format
    await service.configure(invalidConfig)
    expect(service.isConfigured()).toBe(true)
  })

  it('handles configuration errors', async () => {
    // Mock OpenAI constructor to throw an error
    const mockOpenAI = await import('openai')
    vi.mocked(mockOpenAI.default).mockImplementationOnce(() => {
      throw new Error('Invalid API key')
    })

    const config = {
      apiKey: 'invalid-key',
      defaultModel: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    }
    
    await expect(service.configure(config)).rejects.toThrow('Failed to configure OpenAI client')
  })
})