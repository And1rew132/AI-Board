# Issue: Add Real-time Agent Status Monitoring and Notifications

## Priority: Medium

## Description
The application needs better real-time monitoring of agent activities, status updates, and user notifications. This will improve user awareness of agent actions and system state changes.

## Current Issues
- No real-time agent status updates
- No notifications for important events
- Limited visibility into agent activities
- No activity feed or logging
- No performance metrics for agents
- No error notifications

## Proposed Solution

### 1. Real-time Event System

Create `src/services/event-bus.ts`:
```typescript
export interface SystemEvent {
  id: string
  type: 'agent_status' | 'task_completed' | 'error' | 'notification' | 'agent_action'
  timestamp: Date
  source: string
  data: Record<string, any>
  severity: 'info' | 'warning' | 'error' | 'success'
  message: string
}

export class EventBus {
  private static instance: EventBus
  private listeners: Map<string, Array<(event: SystemEvent) => void>> = new Map()
  private events: SystemEvent[] = []
  private maxEvents = 1000

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  emit(event: Omit<SystemEvent, 'id' | 'timestamp'>): void {
    const fullEvent: SystemEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date()
    }

    // Store event
    this.events.unshift(fullEvent)
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents)
    }

    // Notify listeners
    const typeListeners = this.listeners.get(event.type) || []
    const allListeners = this.listeners.get('*') || []
    
    [...typeListeners, ...allListeners].forEach(listener => {
      try {
        listener(fullEvent)
      } catch (error) {
        console.error('Event listener error:', error)
      }
    })

    // Store in localStorage for persistence
    this.persistEvents()
  }

  on(eventType: string, listener: (event: SystemEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    
    this.listeners.get(eventType)!.push(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  off(eventType: string, listener?: (event: SystemEvent) => void): void {
    if (!listener) {
      this.listeners.delete(eventType)
      return
    }

    const listeners = this.listeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  getEvents(filter?: {
    type?: string
    source?: string
    severity?: string
    limit?: number
  }): SystemEvent[] {
    let filtered = this.events

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(e => e.type === filter.type)
      }
      if (filter.source) {
        filtered = filtered.filter(e => e.source === filter.source)
      }
      if (filter.severity) {
        filtered = filtered.filter(e => e.severity === filter.severity)
      }
      if (filter.limit) {
        filtered = filtered.slice(0, filter.limit)
      }
    }

    return filtered
  }

  clearEvents(): void {
    this.events = []
    localStorage.removeItem('ai-board-events')
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private persistEvents(): void {
    try {
      const recentEvents = this.events.slice(0, 100) // Only persist recent events
      localStorage.setItem('ai-board-events', JSON.stringify(recentEvents))
    } catch (error) {
      console.warn('Failed to persist events:', error)
    }
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem('ai-board-events')
      if (stored) {
        this.events = JSON.parse(stored).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }))
      }
    } catch (error) {
      console.warn('Failed to load events:', error)
    }
  }

  constructor() {
    this.loadEvents()
  }
}

export const eventBus = EventBus.getInstance()
```

### 2. Agent Status Monitoring

Update `src/stores/agents.ts` to emit events:
```typescript
import { eventBus } from '@/services/event-bus'

// Add to existing store functions
function updateAgent(id: string, updates: Partial<Agent>) {
  const index = agents.value.findIndex((a: Agent) => a.id === id)
  if (index !== -1) {
    const oldAgent = agents.value[index]
    const newAgent = {
      ...oldAgent,
      ...updates,
      lastActivity: new Date(),
    }
    
    agents.value[index] = newAgent

    // Emit status change event if status changed
    if (oldAgent.status !== newAgent.status) {
      eventBus.emit({
        type: 'agent_status',
        source: `agent-${id}`,
        data: {
          agentId: id,
          agentName: newAgent.name,
          oldStatus: oldAgent.status,
          newStatus: newAgent.status
        },
        severity: newAgent.status === 'error' ? 'error' : 'info',
        message: `Agent ${newAgent.name} status changed to ${newAgent.status}`
      })
    }
  }
}

// Add monitoring for task completion
function updateTask(id: string, updates: Partial<AgentTask>) {
  const index = tasks.value.findIndex((t: AgentTask) => t.id === id)
  if (index !== -1) {
    const oldTask = tasks.value[index]
    const newTask = { ...oldTask, ...updates }
    tasks.value[index] = newTask

    // Emit task completion event
    if (oldTask.status !== 'completed' && newTask.status === 'completed') {
      const agent = agents.value.find(a => a.id === newTask.agentId)
      eventBus.emit({
        type: 'task_completed',
        source: `agent-${newTask.agentId}`,
        data: {
          taskId: id,
          agentId: newTask.agentId,
          agentName: agent?.name || 'Unknown',
          taskDescription: newTask.description,
          result: newTask.result
        },
        severity: newTask.result?.success ? 'success' : 'error',
        message: `Task completed: ${newTask.description}`
      })
    }

    // Emit error events for failed tasks
    if (oldTask.status !== 'failed' && newTask.status === 'failed') {
      const agent = agents.value.find(a => a.id === newTask.agentId)
      eventBus.emit({
        type: 'error',
        source: `agent-${newTask.agentId}`,
        data: {
          taskId: id,
          agentId: newTask.agentId,
          agentName: agent?.name || 'Unknown',
          error: newTask.result?.error
        },
        severity: 'error',
        message: `Task failed: ${newTask.description}`
      })
    }
  }
}
```

### 3. Notification System

Create `src/composables/useNotifications.ts`:
```typescript
import { ref, reactive } from 'vue'
import { eventBus, type SystemEvent } from '@/services/event-bus'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  persistent?: boolean
  action?: {
    label: string
    handler: () => void
  }
}

const notifications = ref<Notification[]>([])
const unreadCount = ref(0)

export function useNotifications() {
  function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false
    }

    notifications.value.unshift(newNotification)
    unreadCount.value++

    // Auto-remove non-persistent notifications after 5 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }

    // Request permission for browser notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      })
    }

    return newNotification
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      const notification = notifications.value[index]
      if (!notification.read) {
        unreadCount.value--
      }
      notifications.value.splice(index, 1)
    }
  }

  function markAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification && !notification.read) {
      notification.read = true
      unreadCount.value--
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(n => n.read = true)
    unreadCount.value = 0
  }

  function clearAll() {
    notifications.value = []
    unreadCount.value = 0
  }

  function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  // Listen to system events and create notifications
  eventBus.on('*', (event: SystemEvent) => {
    if (event.severity === 'error') {
      addNotification({
        title: 'Error',
        message: event.message,
        type: 'error',
        persistent: true
      })
    } else if (event.type === 'task_completed' && event.severity === 'success') {
      addNotification({
        title: 'Task Completed',
        message: event.message,
        type: 'success'
      })
    } else if (event.type === 'agent_status' && event.data.newStatus === 'error') {
      addNotification({
        title: 'Agent Error',
        message: event.message,
        type: 'error',
        persistent: true
      })
    }
  })

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission
  }
}
```

### 4. Activity Feed Component

Create `src/components/ActivityFeed.vue`:
```vue
<template>
  <div class="activity-feed">
    <div class="activity-header">
      <h3>Activity Feed</h3>
      <div class="activity-controls">
        <select 
          v-model="selectedFilter" 
          class="filter-select"
          aria-label="Filter activities"
        >
          <option value="">All Activities</option>
          <option value="agent_status">Agent Status</option>
          <option value="task_completed">Task Completed</option>
          <option value="error">Errors</option>
          <option value="notification">Notifications</option>
        </select>
        
        <Button
          variant="ghost"
          icon="refresh"
          size="sm"
          @click="refreshFeed"
          aria-label="Refresh activity feed"
        >
          Refresh
        </Button>
        
        <Button
          variant="ghost"
          icon="trash"
          size="sm"
          @click="clearFeed"
          aria-label="Clear activity feed"
        >
          Clear
        </Button>
      </div>
    </div>

    <div class="activity-list" role="log" aria-live="polite">
      <TransitionGroup name="activity" tag="div">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="activity-item"
          :class="`activity-${event.severity}`"
        >
          <div class="activity-icon">
            <Icon :name="getEventIcon(event)" aria-hidden="true" />
          </div>
          
          <div class="activity-content">
            <div class="activity-message">{{ event.message }}</div>
            <div class="activity-meta">
              <span class="activity-source">{{ event.source }}</span>
              <span class="activity-time">{{ formatTime(event.timestamp) }}</span>
            </div>
            
            <div v-if="event.data && Object.keys(event.data).length" class="activity-details">
              <details>
                <summary>Show details</summary>
                <pre>{{ JSON.stringify(event.data, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>
      </TransitionGroup>
      
      <div v-if="filteredEvents.length === 0" class="activity-empty">
        <Icon name="activity" aria-hidden="true" />
        <p>No activities to show</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { eventBus, type SystemEvent } from '@/services/event-bus'
import Button from './ui/Button.vue'

const selectedFilter = ref('')
const events = ref<SystemEvent[]>([])

const filteredEvents = computed(() => {
  let filtered = events.value
  
  if (selectedFilter.value) {
    filtered = filtered.filter(event => event.type === selectedFilter.value)
  }
  
  return filtered.slice(0, 50) // Limit to 50 most recent events
})

function refreshFeed() {
  events.value = eventBus.getEvents({ limit: 100 })
}

function clearFeed() {
  eventBus.clearEvents()
  events.value = []
}

function getEventIcon(event: SystemEvent): string {
  switch (event.type) {
    case 'agent_status': return 'user'
    case 'task_completed': return 'check-circle'
    case 'error': return 'alert-circle'
    case 'notification': return 'bell'
    case 'agent_action': return 'activity'
    default: return 'info'
  }
}

function formatTime(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 60000) { // Less than 1 minute
    return 'Just now'
  } else if (diff < 3600000) { // Less than 1 hour
    return `${Math.floor(diff / 60000)}m ago`
  } else if (diff < 86400000) { // Less than 1 day
    return `${Math.floor(diff / 3600000)}h ago`
  } else {
    return timestamp.toLocaleDateString()
  }
}

let unsubscribe: (() => void) | null = null

onMounted(() => {
  refreshFeed()
  
  // Listen for new events
  unsubscribe = eventBus.on('*', (event: SystemEvent) => {
    events.value.unshift(event)
    if (events.value.length > 100) {
      events.value = events.value.slice(0, 100)
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.activity-feed {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.activity-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.activity-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.filter-select {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: var(--spacing-3);
  transition: background-color var(--transition-fast);
}

.activity-item:hover {
  background-color: var(--color-bg-secondary);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--font-size-sm);
}

.activity-info .activity-icon { background-color: var(--color-info); }
.activity-success .activity-icon { background-color: var(--color-success); }
.activity-warning .activity-icon { background-color: var(--color-warning); }
.activity-error .activity-icon { background-color: var(--color-error); }

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-message {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  margin-bottom: var(--spacing-1);
}

.activity-meta {
  display: flex;
  gap: var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2);
}

.activity-details {
  margin-top: var(--spacing-2);
}

.activity-details summary {
  cursor: pointer;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}

.activity-details pre {
  margin-top: var(--spacing-2);
  padding: var(--spacing-2);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  overflow-x: auto;
}

.activity-empty {
  padding: var(--spacing-8);
  text-align: center;
  color: var(--color-text-secondary);
}

.activity-empty p {
  margin: var(--spacing-2) 0 0 0;
}

/* Transitions */
.activity-enter-active,
.activity-leave-active {
  transition: all var(--transition-fast);
}

.activity-enter-from,
.activity-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.activity-move {
  transition: transform var(--transition-fast);
}
</style>
```

### 5. Notification Toast Component

Create `src/components/NotificationToast.vue`:
```vue
<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="toast"
          :class="`toast-${notification.type}`"
          role="alert"
          :aria-live="notification.type === 'error' ? 'assertive' : 'polite'"
        >
          <div class="toast-icon">
            <Icon :name="getNotificationIcon(notification.type)" aria-hidden="true" />
          </div>
          
          <div class="toast-content">
            <div class="toast-title">{{ notification.title }}</div>
            <div class="toast-message">{{ notification.message }}</div>
          </div>
          
          <div class="toast-actions">
            <Button
              v-if="notification.action"
              variant="ghost"
              size="sm"
              @click="notification.action.handler"
            >
              {{ notification.action.label }}
            </Button>
            
            <Button
              variant="ghost"
              icon-only
              icon="x"
              size="sm"
              :aria-label="`Dismiss ${notification.title}`"
              @click="removeNotification(notification.id)"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import Button from './ui/Button.vue'

const { notifications, removeNotification } = useNotifications()

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'success': return 'check-circle'
    case 'warning': return 'alert-triangle'
    case 'error': return 'alert-circle'
    default: return 'info'
  }
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: var(--spacing-4);
  right: var(--spacing-4);
  z-index: var(--z-tooltip);
  pointer-events: none;
}

.toast {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-3);
  max-width: 400px;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  pointer-events: auto;
}

.toast-info { border-left: 4px solid var(--color-info); }
.toast-success { border-left: 4px solid var(--color-success); }
.toast-warning { border-left: 4px solid var(--color-warning); }
.toast-error { border-left: 4px solid var(--color-error); }

.toast-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: var(--spacing-1);
}

.toast-info .toast-icon { color: var(--color-info); }
.toast-success .toast-icon { color: var(--color-success); }
.toast-warning .toast-icon { color: var(--color-warning); }
.toast-error .toast-icon { color: var(--color-error); }

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-1);
}

.toast-message {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.toast-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-base);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform var(--transition-base);
}
</style>
```

## Benefits
- Real-time visibility into agent activities
- Immediate notification of important events
- Better error tracking and debugging
- Improved user awareness of system state
- Historical activity logging
- Configurable notification preferences

## Features
- Event bus system for real-time communication
- Agent status change monitoring
- Task completion notifications
- Error notifications with details
- Activity feed with filtering
- Browser notifications support
- Persistent notification storage

## Acceptance Criteria
- [ ] Event bus system implemented
- [ ] Agent status monitoring working
- [ ] Notification system functional
- [ ] Activity feed component created
- [ ] Toast notifications working
- [ ] Browser notification permission handling
- [ ] Event filtering and search
- [ ] Real-time updates without refresh
- [ ] Error handling and recovery
- [ ] Performance optimized for many events

## Estimated Effort
Medium (8-12 hours)