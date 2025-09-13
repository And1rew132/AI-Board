import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AgentMessage } from '@/types/business';

export const useCommunicationStore = defineStore('communication', () => {
  const messages = ref<AgentMessage[]>([]);

  // Computed properties
  const unreadMessages = computed(() =>
    messages.value.filter(m => m.status === 'delivered')
  );

  const messagesByAgent = computed(() => {
    const grouped: Record<string, AgentMessage[]> = {};
    messages.value.forEach(message => {
      const agentId = message.toAgentId;
      if (!grouped[agentId]) grouped[agentId] = [];
      grouped[agentId].push(message);
    });
    return grouped;
  });

  const urgentMessages = computed(() =>
    messages.value.filter(m => m.priority === 'urgent' && ['sent', 'delivered'].includes(m.status))
  );

  // Message functions
  function sendMessage(messageData: Omit<AgentMessage, 'id' | 'status' | 'createdAt'>): AgentMessage {
    const newMessage: AgentMessage = {
      ...messageData,
      id: generateId(),
      status: 'sent',
      createdAt: new Date()
    };

    messages.value.push(newMessage);

    // Simulate message delivery
    setTimeout(() => {
      markAsDelivered(newMessage.id);
    }, 100);

    // Auto-process certain message types
    processMessageForAutomation(newMessage);

    return newMessage;
  }

  function markAsDelivered(messageId: string) {
    const message = messages.value.find(m => m.id === messageId);
    if (message && message.status === 'sent') {
      message.status = 'delivered';
    }
  }

  function markAsRead(messageId: string) {
    const message = messages.value.find(m => m.id === messageId);
    if (message && ['sent', 'delivered'].includes(message.status)) {
      message.status = 'read';
      message.readAt = new Date();
    }
  }

  function respondToMessage(messageId: string, response: string) {
    const message = messages.value.find(m => m.id === messageId);
    if (message) {
      message.response = response;
      message.status = 'responded';
      message.respondedAt = new Date();

      // Send response back to original sender
      if (message.requiresResponse) {
        sendMessage({
          fromAgentId: message.toAgentId,
          toAgentId: message.fromAgentId,
          type: 'status_update',
          content: `Response: ${response}`,
          context: message.context,
          priority: message.priority,
          requiresResponse: false
        });
      }
    }
  }

  function delegateTask(fromAgentId: string, toAgentId: string, taskDescription: string, context: any = {}) {
    return sendMessage({
      fromAgentId,
      toAgentId,
      type: 'task_delegation',
      content: taskDescription,
      context,
      priority: 'medium',
      requiresResponse: true
    });
  }

  function requestApproval(fromAgentId: string, toAgentId: string, requestDetails: string, context: any = {}) {
    return sendMessage({
      fromAgentId,
      toAgentId,
      type: 'approval_request',
      content: requestDetails,
      context,
      priority: 'high',
      requiresResponse: true
    });
  }

  function broadcastToAgents(fromAgentId: string, agentIds: string[], content: string, type: AgentMessage['type'] = 'information_request') {
    return agentIds.map(agentId => 
      sendMessage({
        fromAgentId,
        toAgentId: agentId,
        type,
        content,
        context: {},
        priority: 'medium',
        requiresResponse: false
      })
    );
  }

  async function processMessageForAutomation(message: AgentMessage) {
    // Auto-handle certain types of messages
    if (message.type === 'task_delegation') {
      await handleTaskDelegation(message);
    } else if (message.type === 'approval_request') {
      await handleApprovalRequest(message);
    }
  }

  async function handleTaskDelegation(message: AgentMessage) {
    // Import agent store to create actual tasks
    const { useAgentStore } = await import('@/stores/agents');
    const agentStore = useAgentStore();

    // Find the target agent
    const targetAgent = agentStore.agents.find(a => a.id === message.toAgentId);
    if (!targetAgent) return;

    // Create a task for the target agent
    const task = agentStore.createTask({
      agentId: message.toAgentId,
      projectId: message.context.projectId || '',
      description: message.content,
      status: 'pending',
      type: 'create_content',
      priority: message.priority === 'urgent' ? 'urgent' : 'medium',
      dependencies: []
    });

    // Update message with task reference
    message.context.taskId = task.id;

    // Auto-respond with confirmation
    setTimeout(() => {
      respondToMessage(message.id, `Task created and assigned: ${task.id}`);
    }, 1000);
  }

  async function handleApprovalRequest(message: AgentMessage) {
    // In a real system, this would route to appropriate approvers
    // For now, we'll simulate a basic approval process
    
    const requiresHumanApproval = message.content.toLowerCase().includes('human') || 
                                  message.content.toLowerCase().includes('manual') ||
                                  message.priority === 'urgent';

    const autoApproveKeywords = ['routine', 'standard', 'regular', 'normal'];

    if (!requiresHumanApproval && autoApproveKeywords.some(keyword => 
      message.content.toLowerCase().includes(keyword)
    )) {
      // Auto-approve routine requests
      setTimeout(() => {
        respondToMessage(message.id, 'Auto-approved: Routine request approved automatically.');
      }, 2000);
    } else {
      // Route to human or escalate
      setTimeout(() => {
        respondToMessage(message.id, 'Escalated: Request requires human approval and has been forwarded.');
      }, 1000);
    }
  }

  function getConversation(agentId1: string, agentId2: string): AgentMessage[] {
    return messages.value.filter(m => 
      (m.fromAgentId === agentId1 && m.toAgentId === agentId2) ||
      (m.fromAgentId === agentId2 && m.toAgentId === agentId1)
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  function getMessagesForAgent(agentId: string): AgentMessage[] {
    return messages.value.filter(m => 
      m.toAgentId === agentId || m.fromAgentId === agentId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  function getUnreadMessagesForAgent(agentId: string): AgentMessage[] {
    return messages.value.filter(m => 
      m.toAgentId === agentId && m.status === 'delivered'
    );
  }

  function markAllAsRead(agentId: string) {
    const unreadForAgent = getUnreadMessagesForAgent(agentId);
    unreadForAgent.forEach(message => {
      markAsRead(message.id);
    });
  }

  function deleteMessage(messageId: string) {
    const index = messages.value.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Collaboration helpers
  function createCollaborationRequest(fromAgentId: string, toAgentId: string, projectId: string, proposal: string) {
    return sendMessage({
      fromAgentId,
      toAgentId,
      type: 'collaboration',
      content: `Collaboration proposal: ${proposal}`,
      context: { projectId, type: 'collaboration_request' },
      priority: 'medium',
      requiresResponse: true
    });
  }

  function requestInformation(fromAgentId: string, toAgentId: string, query: string, context: any = {}) {
    return sendMessage({
      fromAgentId,
      toAgentId,
      type: 'information_request',
      content: query,
      context,
      priority: 'medium',
      requiresResponse: true
    });
  }

  function sendStatusUpdate(fromAgentId: string, toAgentId: string, status: string, context: any = {}) {
    return sendMessage({
      fromAgentId,
      toAgentId,
      type: 'status_update',
      content: status,
      context,
      priority: 'low',
      requiresResponse: false
    });
  }

  return {
    messages,
    unreadMessages,
    messagesByAgent,
    urgentMessages,
    sendMessage,
    markAsDelivered,
    markAsRead,
    respondToMessage,
    delegateTask,
    requestApproval,
    broadcastToAgents,
    getConversation,
    getMessagesForAgent,
    getUnreadMessagesForAgent,
    markAllAsRead,
    deleteMessage,
    createCollaborationRequest,
    requestInformation,
    sendStatusUpdate,
  };
}, {
  persist: {
    storage: localStorage,
    pick: ['messages']
  }
});