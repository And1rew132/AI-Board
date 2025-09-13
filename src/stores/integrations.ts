import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ExternalIntegration, BusinessMetrics } from '@/types/business';

export const useIntegrationStore = defineStore('integrations', () => {
  const integrations = ref<ExternalIntegration[]>([]);
  const metrics = ref<BusinessMetrics[]>([]);

  // Computed properties
  const connectedIntegrations = computed(() => 
    integrations.value.filter(i => i.status === 'connected')
  );

  const activeIntegrations = computed(() =>
    integrations.value.filter(i => i.isActive && i.status === 'connected')
  );

  const integrationsByType = computed(() => {
    const grouped: Record<string, ExternalIntegration[]> = {};
    integrations.value.forEach(integration => {
      if (!grouped[integration.type]) {
        grouped[integration.type] = [];
      }
      grouped[integration.type].push(integration);
    });
    return grouped;
  });

  // Integration functions
  function addIntegration(integrationData: Omit<ExternalIntegration, 'id' | 'metadata'>): ExternalIntegration {
    const newIntegration: ExternalIntegration = {
      ...integrationData,
      id: generateId(),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    };

    integrations.value.push(newIntegration);
    return newIntegration;
  }

  function updateIntegration(id: string, updates: Partial<ExternalIntegration>) {
    const index = integrations.value.findIndex(i => i.id === id);
    if (index !== -1) {
      integrations.value[index] = {
        ...integrations.value[index],
        ...updates,
        metadata: {
          ...integrations.value[index].metadata,
          updatedAt: new Date()
        }
      };
    }
  }

  function deleteIntegration(id: string) {
    const index = integrations.value.findIndex(i => i.id === id);
    if (index !== -1) {
      integrations.value.splice(index, 1);
    }
  }

  function testIntegration(id: string): Promise<boolean> {
    const integration = integrations.value.find(i => i.id === id);
    if (!integration) return Promise.resolve(false);

    // Simulate integration testing
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        if (success) {
          updateIntegration(id, { 
            status: 'connected',
            lastSync: new Date(),
            errorMessage: undefined
          });
        } else {
          updateIntegration(id, { 
            status: 'error',
            errorMessage: 'Connection failed: Invalid credentials'
          });
        }
        resolve(success);
      }, 2000);
    });
  }

  // Webhook simulation for customer inquiries
  function handleIncomingWebhook(source: string, data: any) {
    if (source === 'email' && data.type === 'customer_inquiry') {
      // Route to business store
      const { useBusinessStore } = require('@/stores/business');
      const businessStore = useBusinessStore();

      businessStore.createInquiry({
        source: 'email',
        subject: data.subject || 'Email Inquiry',
        content: data.content || data.body,
        customerInfo: {
          name: data.from_name,
          email: data.from_email,
          customerId: data.customer_id
        },
        category: 'other', // Let auto-categorization work
        priority: 'medium',
        status: 'new',
        tags: data.tags || []
      });
    }
  }

  // Business metrics functions
  function recordMetrics(metricsData: Omit<BusinessMetrics, 'id'>): BusinessMetrics {
    const newMetrics: BusinessMetrics = {
      ...metricsData,
      id: generateId()
    };

    metrics.value.push(newMetrics);
    
    // Keep only last 100 metric records
    if (metrics.value.length > 100) {
      metrics.value = metrics.value.slice(-100);
    }

    return newMetrics;
  }

  function calculateCurrentMetrics(): BusinessMetrics {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Import other stores to calculate metrics
    const { useBusinessStore } = require('@/stores/business');
    const { useAgentStore } = require('@/stores/agents');
    const { useCommunicationStore } = require('@/stores/communication');

    const businessStore = useBusinessStore();
    const agentStore = useAgentStore();
    const communicationStore = useCommunicationStore();

    const todayInquiries = businessStore.inquiries.filter(i => 
      i.metadata.createdAt >= startOfDay
    );

    const resolvedInquiries = todayInquiries.filter(i => 
      i.status === 'resolved' || i.status === 'closed'
    );

    const avgResponseTime = todayInquiries.reduce((sum, inquiry) => {
      return sum + (inquiry.metadata.responseTime || 0);
    }, 0) / Math.max(todayInquiries.length, 1);

    const avgResolutionTime = resolvedInquiries.reduce((sum, inquiry) => {
      return sum + (inquiry.metadata.resolutionTime || 0);
    }, 0) / Math.max(resolvedInquiries.length, 1);

    const todayTasks = agentStore.tasks.filter(t => 
      t.createdAt >= startOfDay
    );

    const completedTasks = todayTasks.filter(t => t.status === 'completed');

    const avgTaskTime = completedTasks.reduce((sum, task) => {
      const duration = task.completedAt ? 
        (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60) : 0;
      return sum + duration;
    }, 0) / Math.max(completedTasks.length, 1);

    const todayMessages = communicationStore.messages.filter(m => 
      m.createdAt >= startOfDay
    );

    return {
      id: generateId(),
      period: 'daily',
      startDate: startOfDay,
      endDate: now,
      metrics: {
        customerInquiries: {
          total: todayInquiries.length,
          resolved: resolvedInquiries.length,
          avgResponseTime: Math.round(avgResponseTime),
          avgResolutionTime: Math.round(avgResolutionTime / 60), // Convert to hours
          byCategory: todayInquiries.reduce((acc, inquiry) => {
            acc[inquiry.category] = (acc[inquiry.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          bySource: todayInquiries.reduce((acc, inquiry) => {
            acc[inquiry.source] = (acc[inquiry.source] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        },
        agentPerformance: {
          totalTasks: todayTasks.length,
          completedTasks: completedTasks.length,
          avgTaskTime: Math.round(avgTaskTime),
          successRate: Math.round((completedTasks.length / Math.max(todayTasks.length, 1)) * 100),
          collaborations: todayMessages.filter(m => m.type === 'collaboration').length,
          autonomousActions: todayTasks.filter(t => t.description.includes('autonomous')).length
        },
        workflows: {
          totalExecutions: businessStore.executions.filter(e => e.startedAt >= startOfDay).length,
          successfulExecutions: businessStore.executions.filter(e => 
            e.startedAt >= startOfDay && e.results.success
          ).length,
          avgDuration: 5, // Placeholder - would calculate from actual executions
          byCategory: { customer_service: todayInquiries.length }
        },
        business: {
          automationSavings: Math.round(completedTasks.length * 0.5), // Estimate 30 minutes saved per task
          processEfficiency: Math.round(85 + Math.random() * 10) // Simulated efficiency score
        }
      }
    };
  }

  // Initialize with sample integrations
  function initializeDefaultIntegrations() {
    const defaultIntegrations: ExternalIntegration[] = [
      {
        id: 'email-integration',
        name: 'Email Support Integration',
        type: 'email',
        provider: 'gmail',
        status: 'connected',
        config: {
          endpoint: 'smtp.gmail.com',
          webhookUrl: '/webhook/email'
        },
        capabilities: ['send_email', 'receive_email', 'auto_categorize'],
        isActive: true,
        lastSync: new Date(),
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        }
      },
      {
        id: 'slack-integration',
        name: 'Team Communication',
        type: 'communication',
        provider: 'slack',
        status: 'disconnected',
        config: {
          webhookUrl: '/webhook/slack'
        },
        capabilities: ['send_message', 'create_channel', 'notify_team'],
        isActive: false,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        }
      },
      {
        id: 'analytics-integration',
        name: 'Business Analytics',
        type: 'analytics',
        provider: 'custom',
        status: 'connected',
        config: {
          endpoint: '/api/analytics'
        },
        capabilities: ['track_metrics', 'generate_reports', 'real_time_monitoring'],
        isActive: true,
        lastSync: new Date(),
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        }
      }
    ];

    integrations.value = defaultIntegrations;
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Initialize with defaults
  initializeDefaultIntegrations();

  return {
    integrations,
    metrics,
    connectedIntegrations,
    activeIntegrations,
    integrationsByType,
    addIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    handleIncomingWebhook,
    recordMetrics,
    calculateCurrentMetrics,
  };
}, {
  persist: {
    storage: localStorage,
    pick: ['integrations', 'metrics']
  }
});