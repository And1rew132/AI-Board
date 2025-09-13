import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import AgentManager from '@/components/AgentManager.vue'

describe('AgentManager Component', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
  })

  it('renders properly', () => {
    const wrapper = mount(AgentManager, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.text()).toContain('Agent Manager')
    expect(wrapper.text()).toContain('Select an Agent Template')
    expect(wrapper.text()).toContain('Agents')
  })

  it('shows agent templates section', () => {
    const wrapper = mount(AgentManager, {
      global: {
        plugins: [pinia]
      }
    })
    
    const templateSection = wrapper.find('.agent-templates')
    expect(templateSection.exists()).toBe(true)
    expect(templateSection.text()).toContain('Select an Agent Template')
  })

  it('shows agents list section', () => {
    const wrapper = mount(AgentManager, {
      global: {
        plugins: [pinia]
      }
    })
    
    const agentsList = wrapper.find('.agent-list')
    expect(agentsList.exists()).toBe(true)
    expect(agentsList.text()).toContain('Agents')
  })

  it('has generate agent with OpenAI button', () => {
    const wrapper = mount(AgentManager, {
      global: {
        plugins: [pinia]
      }
    })
    
    const generateButton = wrapper.find('button:contains("Generate Agent with OpenAI")')
    expect(generateButton.exists()).toBe(false) // Using contains selector won't work, let's check text content
    
    const buttons = wrapper.findAll('button')
    const generateBtnExists = buttons.some(btn => btn.text().includes('Generate Agent with OpenAI'))
    expect(generateBtnExists).toBe(true)
  })

  it('shows AI generator modal when generate button is clicked', async () => {
    const wrapper = mount(AgentManager, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Initially, modal should not be visible
    expect(wrapper.find('.ai-generator-modal').exists()).toBe(false)
    
    // Find and click the generate button
    const buttons = wrapper.findAll('button')
    const generateBtn = buttons.find(btn => btn.text().includes('Generate Agent with OpenAI'))
    expect(generateBtn).toBeDefined()
    
    await generateBtn!.trigger('click')
    
    // Modal should now be visible
    expect(wrapper.find('.ai-generator-modal').exists()).toBe(true)
    expect(wrapper.text()).toContain('Generate Agent with OpenAI')
    expect(wrapper.text()).toContain('Describe the agent you want:')
  })

  it('can close AI generator modal', async () => {
    const wrapper = mount(AgentManager, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Open modal first
    const buttons = wrapper.findAll('button')
    const generateBtn = buttons.find(btn => btn.text().includes('Generate Agent with OpenAI'))
    await generateBtn!.trigger('click')
    
    expect(wrapper.find('.ai-generator-modal').exists()).toBe(true)
    
    // Find and click cancel button
    const cancelBtn = wrapper.find('button[type="button"]:contains("Cancel")')
    if (!cancelBtn.exists()) {
      // Fallback to finding by text content
      const modalButtons = wrapper.findAll('.ai-generator-modal button')
      const cancelButton = modalButtons.find(btn => btn.text().includes('Cancel'))
      expect(cancelButton).toBeDefined()
      await cancelButton!.trigger('click')
    } else {
      await cancelBtn.trigger('click')
    }
    
    // Modal should be hidden
    expect(wrapper.find('.ai-generator-modal').exists()).toBe(false)
  })

  it('has textarea for agent prompt in modal', async () => {
    const wrapper = mount(AgentManager, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Open modal
    const buttons = wrapper.findAll('button')
    const generateBtn = buttons.find(btn => btn.text().includes('Generate Agent with OpenAI'))
    await generateBtn!.trigger('click')
    
    // Check for textarea
    const textarea = wrapper.find('#agentPrompt')
    expect(textarea.exists()).toBe(true)
    expect(textarea.element.tagName).toBe('TEXTAREA')
  })
})