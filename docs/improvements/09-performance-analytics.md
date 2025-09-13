# Issue: Add Performance Monitoring and Analytics

## Priority: Low

## Description
Add comprehensive performance monitoring, analytics, and metrics collection to understand system performance, user behavior, and optimization opportunities.

## Current State
- No performance monitoring
- No analytics collection
- No error tracking beyond console logs
- No user behavior insights
- No system health monitoring

## Proposed Solution

### 1. Performance Monitoring Service

Create `src/services/performance.ts`:
```typescript
export interface PerformanceMetric {
  id: string
  type: 'page_load' | 'api_call' | 'component_render' | 'user_action'
  name: string
  duration: number
  timestamp: Date
  metadata?: Record<string, any>
  url?: string
  userAgent?: string
}

export interface SystemHealth {
  timestamp: Date
  metrics: {
    memoryUsage: number
    renderTime: number
    bundleSize: number
    activeAgents: number
    activeTasks: number
    errorRate: number
  }
}

export class PerformanceService {
  private static instance: PerformanceService
  private metrics: PerformanceMetric[] = []
  private healthChecks: SystemHealth[] = []
  private observer?: PerformanceObserver

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService()
    }
    return PerformanceService.instance
  }

  init(): void {
    this.setupPerformanceObserver()
    this.collectInitialMetrics()
    this.startHealthChecks()
  }

  trackMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: new Date()
    }

    this.metrics.push(fullMetric)
    
    // Limit metrics storage
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Send to analytics if configured
    this.sendToAnalytics(fullMetric)
  }

  trackPageLoad(route: string): void {
    const loadTime = performance.now()
    
    this.trackMetric({
      type: 'page_load',
      name: `route_${route}`,
      duration: loadTime,
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  }

  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    this.trackMetric({
      type: 'api_call',
      name: endpoint,
      duration,
      metadata: { success }
    })
  }

  trackUserAction(action: string, metadata?: Record<string, any>): void {
    this.trackMetric({
      type: 'user_action',
      name: action,
      duration: 0,
      metadata
    })
  }

  getMetrics(filter?: {
    type?: string
    timeRange?: { start: Date; end: Date }
    limit?: number
  }): PerformanceMetric[] {
    let filtered = this.metrics

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(m => m.type === filter.type)
      }
      if (filter.timeRange) {
        filtered = filtered.filter(m => 
          m.timestamp >= filter.timeRange!.start && 
          m.timestamp <= filter.timeRange!.end
        )
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit)
      }
    }

    return filtered
  }

  getAverageMetric(name: string, timeRange?: { start: Date; end: Date }): number {
    const metrics = this.getMetrics({
      timeRange
    }).filter(m => m.name === name)

    if (metrics.length === 0) return 0

    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
  }

  getSystemHealth(): SystemHealth | null {
    return this.healthChecks[this.healthChecks.length - 1] || null
  }

  getHealthHistory(hours = 24): SystemHealth[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.healthChecks.filter(h => h.timestamp >= cutoff)
  }

  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          this.trackMetric({
            type: 'page_load',
            name: 'navigation',
            duration: navEntry.loadEventEnd - navEntry.fetchStart,
            metadata: {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              firstPaint: navEntry.responseStart - navEntry.fetchStart
            }
          })
        }

        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          if (resourceEntry.name.includes('api') || resourceEntry.name.includes('xhr')) {
            this.trackMetric({
              type: 'api_call',
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              metadata: {
                transferSize: resourceEntry.transferSize,
                responseStatus: (resourceEntry as any).responseStatus
              }
            })
          }
        }
      })
    })

    this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] })
  }

  private collectInitialMetrics(): void {
    if ('performance' in window && 'memory' in (performance as any)) {
      const memory = (performance as any).memory
      this.trackMetric({
        type: 'component_render',
        name: 'initial_memory',
        duration: 0,
        metadata: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      })
    }
  }

  private startHealthChecks(): void {
    const collectHealthMetrics = () => {
      const memory = (performance as any).memory
      const agentStore = useAgentStore()
      
      const health: SystemHealth = {
        timestamp: new Date(),
        metrics: {
          memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0, // MB
          renderTime: this.getAverageMetric('component_render'),
          bundleSize: 0, // Would need to be calculated at build time
          activeAgents: agentStore.activeAgents.length,
          activeTasks: agentStore.tasks.filter(t => t.status === 'in_progress').length,
          errorRate: this.calculateErrorRate()
        }
      }

      this.healthChecks.push(health)
      
      // Limit health check history
      if (this.healthChecks.length > 1440) { // 24 hours of minute-by-minute data
        this.healthChecks = this.healthChecks.slice(-1440)
      }
    }

    // Collect health metrics every minute
    setInterval(collectHealthMetrics, 60000)
    collectHealthMetrics() // Initial collection
  }

  private calculateErrorRate(): number {
    const recentMetrics = this.getMetrics({
      timeRange: {
        start: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        end: new Date()
      }
    })

    const apiCalls = recentMetrics.filter(m => m.type === 'api_call')
    if (apiCalls.length === 0) return 0

    const errors = apiCalls.filter(m => m.metadata?.success === false)
    return errors.length / apiCalls.length
  }

  private sendToAnalytics(metric: PerformanceMetric): void {
    // Implement analytics service integration here
    // Could send to Google Analytics, Mixpanel, or custom analytics
    if (import.meta.env.VITE_ANALYTICS_ENABLED === 'true') {
      // Send to analytics service
      console.debug('Analytics metric:', metric)
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export const performanceService = PerformanceService.getInstance()
```

### 2. Error Tracking Service

Create `src/services/error-tracking.ts`:
```typescript
export interface ErrorReport {
  id: string
  message: string
  stack?: string
  timestamp: Date
  url: string
  userAgent: string
  userId?: string
  sessionId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context: Record<string, any>
  resolved: boolean
}

export class ErrorTrackingService {
  private static instance: ErrorTrackingService
  private errors: ErrorReport[] = []
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupGlobalErrorHandling()
  }

  static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService()
    }
    return ErrorTrackingService.instance
  }

  captureError(
    error: Error | string,
    context: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateId(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      severity,
      context,
      resolved: false
    }

    this.errors.push(errorReport)
    
    // Limit error storage
    if (this.errors.length > 500) {
      this.errors = this.errors.slice(-500)
    }

    // Send to external error tracking service
    this.sendToErrorService(errorReport)

    // Emit event for UI notification
    eventBus.emit({
      type: 'error',
      source: 'error-tracking',
      data: errorReport,
      severity: 'error',
      message: `Error captured: ${errorReport.message}`
    })
  }

  getErrors(filter?: {
    severity?: string
    resolved?: boolean
    timeRange?: { start: Date; end: Date }
    limit?: number
  }): ErrorReport[] {
    let filtered = this.errors

    if (filter) {
      if (filter.severity) {
        filtered = filtered.filter(e => e.severity === filter.severity)
      }
      if (filter.resolved !== undefined) {
        filtered = filtered.filter(e => e.resolved === filter.resolved)
      }
      if (filter.timeRange) {
        filtered = filtered.filter(e => 
          e.timestamp >= filter.timeRange!.start && 
          e.timestamp <= filter.timeRange!.end
        )
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit)
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  markResolved(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
    }
  }

  getErrorStats(): {
    total: number
    unresolved: number
    bySeverity: Record<string, number>
    byTimeRange: Array<{ date: string; count: number }>
  } {
    const total = this.errors.length
    const unresolved = this.errors.filter(e => !e.resolved).length
    
    const bySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by day for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentErrors = this.errors.filter(e => e.timestamp >= sevenDaysAgo)
    
    const byTimeRange = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = recentErrors.filter(e => 
        e.timestamp.toISOString().split('T')[0] === dateStr
      ).length
      
      byTimeRange.push({ date: dateStr, count })
    }

    return { total, unresolved, bySeverity, byTimeRange }
  }

  private setupGlobalErrorHandling(): void {
    // Capture unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, 'high')
    })

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandled_promise_rejection'
      }, 'high')
    })

    // Capture Vue errors (would need to be set up in main.ts)
    // app.config.errorHandler = (error, instance, info) => {
    //   this.captureError(error, { component: instance?.$options.name, info }, 'medium')
    // }
  }

  private sendToErrorService(error: ErrorReport): void {
    // Implement external error service integration
    // Could send to Sentry, LogRocket, Bugsnag, etc.
    if (import.meta.env.VITE_ERROR_TRACKING_ENABLED === 'true') {
      console.error('Error tracked:', error)
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export const errorTracking = ErrorTrackingService.getInstance()
```

### 3. Analytics Dashboard Component

Create `src/components/AnalyticsDashboard.vue`:
```vue
<template>
  <div class="analytics-dashboard">
    <div class="dashboard-header">
      <h2>Analytics Dashboard</h2>
      <div class="time-range-selector">
        <select v-model="selectedTimeRange" @change="updateMetrics">
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
    </div>

    <div class="metrics-grid">
      <!-- Performance Metrics -->
      <div class="metric-card">
        <h3>Performance</h3>
        <div class="metric-value">
          {{ Math.round(averagePageLoad) }}ms
          <span class="metric-label">Avg Page Load</span>
        </div>
        <div class="metric-chart">
          <div
            v-for="(point, index) in pageLoadHistory"
            :key="index"
            class="chart-bar"
            :style="{ height: `${(point / maxPageLoad) * 100}%` }"
          />
        </div>
      </div>

      <!-- System Health -->
      <div class="metric-card">
        <h3>System Health</h3>
        <div class="health-indicators">
          <div class="health-item">
            <span class="health-label">Memory Usage</span>
            <div class="health-bar">
              <div 
                class="health-fill"
                :style="{ width: `${Math.min(currentHealth?.metrics.memoryUsage || 0, 100)}%` }"
              />
            </div>
            <span class="health-value">{{ Math.round(currentHealth?.metrics.memoryUsage || 0) }}MB</span>
          </div>
          
          <div class="health-item">
            <span class="health-label">Error Rate</span>
            <div class="health-bar">
              <div 
                class="health-fill error"
                :style="{ width: `${(currentHealth?.metrics.errorRate || 0) * 100}%` }"
              />
            </div>
            <span class="health-value">{{ Math.round((currentHealth?.metrics.errorRate || 0) * 100) }}%</span>
          </div>
        </div>
      </div>

      <!-- Agent Activity -->
      <div class="metric-card">
        <h3>Agent Activity</h3>
        <div class="metric-value">
          {{ currentHealth?.metrics.activeAgents || 0 }}
          <span class="metric-label">Active Agents</span>
        </div>
        <div class="metric-value">
          {{ currentHealth?.metrics.activeTasks || 0 }}
          <span class="metric-label">Active Tasks</span>
        </div>
      </div>

      <!-- Error Summary -->
      <div class="metric-card">
        <h3>Errors</h3>
        <div class="error-stats">
          <div class="error-stat">
            <span class="error-count">{{ errorStats.unresolved }}</span>
            <span class="error-label">Unresolved</span>
          </div>
          <div class="error-breakdown">
            <div 
              v-for="(count, severity) in errorStats.bySeverity"
              :key="severity"
              class="error-severity"
              :class="`severity-${severity}`"
            >
              {{ severity }}: {{ count }}
            </div>
          </div>
        </div>
      </div>

      <!-- User Actions -->
      <div class="metric-card">
        <h3>User Actions</h3>
        <div class="action-list">
          <div 
            v-for="action in topUserActions"
            :key="action.name"
            class="action-item"
          >
            <span class="action-name">{{ action.name }}</span>
            <span class="action-count">{{ action.count }}</span>
          </div>
        </div>
      </div>

      <!-- API Performance -->
      <div class="metric-card">
        <h3>API Performance</h3>
        <div class="api-metrics">
          <div 
            v-for="api in apiMetrics"
            :key="api.endpoint"
            class="api-item"
          >
            <span class="api-endpoint">{{ api.endpoint }}</span>
            <span class="api-time">{{ Math.round(api.averageTime) }}ms</span>
            <span class="api-success" :class="{ 'low-success': api.successRate < 0.9 }">
              {{ Math.round(api.successRate * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Charts Section -->
    <div class="charts-section">
      <div class="chart-container">
        <h3>Error Trends</h3>
        <div class="line-chart">
          <div 
            v-for="(point, index) in errorStats.byTimeRange"
            :key="index"
            class="chart-point"
            :style="{ 
              left: `${(index / (errorStats.byTimeRange.length - 1)) * 100}%`,
              bottom: `${(point.count / maxErrors) * 100}%`
            }"
            :title="`${point.date}: ${point.count} errors`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { performanceService } from '@/services/performance'
import { errorTracking } from '@/services/error-tracking'

const selectedTimeRange = ref('24h')
const currentHealth = ref(performanceService.getSystemHealth())
const pageLoadHistory = ref<number[]>([])
const errorStats = ref(errorTracking.getErrorStats())

const averagePageLoad = computed(() => {
  const timeRange = getTimeRange()
  return performanceService.getAverageMetric('page_load', timeRange)
})

const maxPageLoad = computed(() => Math.max(...pageLoadHistory.value, 1))

const topUserActions = computed(() => {
  const timeRange = getTimeRange()
  const actions = performanceService.getMetrics({
    type: 'user_action',
    timeRange
  })

  const actionCounts = actions.reduce((acc, action) => {
    acc[action.name] = (acc[action.name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(actionCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

const apiMetrics = computed(() => {
  const timeRange = getTimeRange()
  const apiCalls = performanceService.getMetrics({
    type: 'api_call',
    timeRange
  })

  const endpointStats = apiCalls.reduce((acc, call) => {
    if (!acc[call.name]) {
      acc[call.name] = {
        endpoint: call.name,
        times: [],
        successes: 0,
        total: 0
      }
    }
    
    acc[call.name].times.push(call.duration)
    acc[call.name].total++
    if (call.metadata?.success !== false) {
      acc[call.name].successes++
    }
    
    return acc
  }, {} as Record<string, any>)

  return Object.values(endpointStats).map((stat: any) => ({
    endpoint: stat.endpoint.split('/').pop() || stat.endpoint,
    averageTime: stat.times.reduce((a: number, b: number) => a + b, 0) / stat.times.length,
    successRate: stat.successes / stat.total
  }))
})

const maxErrors = computed(() => 
  Math.max(...errorStats.value.byTimeRange.map(p => p.count), 1)
)

function getTimeRange(): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()

  switch (selectedTimeRange.value) {
    case '1h':
      start.setHours(start.getHours() - 1)
      break
    case '24h':
      start.setDate(start.getDate() - 1)
      break
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
  }

  return { start, end }
}

function updateMetrics(): void {
  const timeRange = getTimeRange()
  const pageLoads = performanceService.getMetrics({
    type: 'page_load',
    timeRange,
    limit: 20
  })

  pageLoadHistory.value = pageLoads.map(p => p.duration)
  errorStats.value = errorTracking.getErrorStats()
  currentHealth.value = performanceService.getSystemHealth()
}

let updateInterval: NodeJS.Timeout

onMounted(() => {
  updateMetrics()
  updateInterval = setInterval(updateMetrics, 30000) // Update every 30 seconds
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.analytics-dashboard {
  padding: var(--spacing-6);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.dashboard-header h2 {
  margin: 0;
}

.time-range-selector select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.metric-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.metric-card h3 {
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--font-size-lg);
}

.metric-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-2);
}

.metric-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-normal);
}

.metric-chart {
  display: flex;
  align-items: end;
  height: 60px;
  gap: 2px;
  margin-top: var(--spacing-3);
}

.chart-bar {
  flex: 1;
  background: var(--color-primary);
  opacity: 0.7;
  min-height: 2px;
  border-radius: 2px;
}

.health-indicators {
  space-y: var(--spacing-3);
}

.health-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.health-label {
  flex: 1;
  font-size: var(--font-size-sm);
}

.health-bar {
  flex: 2;
  height: 8px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: var(--color-success);
  transition: width var(--transition-base);
}

.health-fill.error {
  background: var(--color-error);
}

.health-value {
  flex: 0 0 auto;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.error-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.error-stat {
  text-align: center;
}

.error-count {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-error);
}

.error-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.error-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.error-severity {
  font-size: var(--font-size-sm);
  padding: var(--spacing-1);
  border-radius: var(--radius-md);
}

.severity-critical { background: var(--color-error); color: white; }
.severity-high { background: #fef2f2; color: var(--color-error); }
.severity-medium { background: #fffbeb; color: var(--color-warning); }
.severity-low { background: var(--color-gray-100); color: var(--color-text); }

.action-list,
.api-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.action-item,
.api-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-2);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.api-success.low-success {
  color: var(--color-error);
  font-weight: var(--font-weight-semibold);
}

.charts-section {
  margin-top: var(--spacing-8);
}

.chart-container {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.line-chart {
  position: relative;
  height: 200px;
  margin-top: var(--spacing-4);
}

.chart-point {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--color-error);
  border-radius: 50%;
  transform: translate(-50%, 50%);
  cursor: pointer;
}

.chart-point:hover {
  background: var(--color-error);
  transform: translate(-50%, 50%) scale(1.2);
}
</style>
```

## Benefits
- Deep insights into application performance
- Proactive error detection and tracking
- User behavior analytics
- System health monitoring
- Performance optimization opportunities
- Data-driven decision making

## Features
- Real-time performance monitoring
- Error tracking and reporting
- System health metrics
- User action analytics
- API performance monitoring
- Visual analytics dashboard

## Acceptance Criteria
- [ ] Performance monitoring service implemented
- [ ] Error tracking with global handlers
- [ ] Analytics dashboard component created
- [ ] Metrics collection for all key areas
- [ ] Performance optimization recommendations
- [ ] Error alerting and notifications
- [ ] Historical data retention
- [ ] Export capabilities for reports
- [ ] Privacy-compliant data collection
- [ ] Integration with external analytics tools

## Estimated Effort
Medium (8-12 hours)