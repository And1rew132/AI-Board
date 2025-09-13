import type { MCPEndpoint } from '@/types';

export class MCPService {
  private endpoints: Map<string, MCPEndpoint> = new Map();

  addEndpoint(endpoint: MCPEndpoint) {
    this.endpoints.set(endpoint.id, endpoint);
  }

  removeEndpoint(id: string) {
    this.endpoints.delete(id);
  }

  getEndpoint(id: string): MCPEndpoint | undefined {
    return this.endpoints.get(id);
  }

  getActiveEndpoints(): MCPEndpoint[] {
    return Array.from(this.endpoints.values()).filter(endpoint => endpoint.isActive);
  }

  async callEndpoint(endpointId: string, method: string, params: any = {}): Promise<any> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }

    if (!endpoint.isActive) {
      throw new Error(`Endpoint is not active: ${endpointId}`);
    }

    try {
      const response = await this.makeRequest(endpoint, method, params);
      return response;
    } catch (error) {
      console.error(`MCP call failed for ${endpointId}:`, error);
      throw error;
    }
  }

  private async makeRequest(endpoint: MCPEndpoint, method: string, params: any): Promise<any> {
    const requestBody = {
      jsonrpc: '2.0',
      id: this.generateRequestId(),
      method,
      params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication headers if configured
    if (endpoint.auth) {
      switch (endpoint.auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${endpoint.auth.credentials.token}`;
          break;
        case 'api_key':
          headers['X-API-Key'] = endpoint.auth.credentials.apiKey;
          break;
        case 'oauth':
          headers['Authorization'] = `Bearer ${endpoint.auth.credentials.accessToken}`;
          break;
      }
    }

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`MCP Error: ${data.error.message}`);
    }

    return data.result;
  }

  async queryKnowledgeBase(endpointId: string, query: string): Promise<any> {
    return this.callEndpoint(endpointId, 'knowledge/query', { query });
  }

  async executeToolCall(endpointId: string, tool: string, args: any): Promise<any> {
    return this.callEndpoint(endpointId, 'tools/execute', { tool, args });
  }

  async getAvailableTools(endpointId: string): Promise<any> {
    return this.callEndpoint(endpointId, 'tools/list');
  }

  async getCapabilities(endpointId: string): Promise<any> {
    return this.callEndpoint(endpointId, 'capabilities');
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Health check methods
  async checkEndpointHealth(endpointId: string): Promise<boolean> {
    try {
      await this.callEndpoint(endpointId, 'ping');
      return true;
    } catch (error) {
      console.warn(`Endpoint ${endpointId} health check failed:`, error);
      return false;
    }
  }

  async checkAllEndpointsHealth(): Promise<Map<string, boolean>> {
    const healthStatus = new Map<string, boolean>();
    
    for (const endpoint of this.getActiveEndpoints()) {
      const isHealthy = await this.checkEndpointHealth(endpoint.id);
      healthStatus.set(endpoint.id, isHealthy);
    }
    
    return healthStatus;
  }

  // Batch operations
  async batchCall(calls: Array<{ endpointId: string; method: string; params?: any }>): Promise<any[]> {
    const promises = calls.map(call => 
      this.callEndpoint(call.endpointId, call.method, call.params)
        .catch(error => ({ error: error.message }))
    );
    
    return Promise.all(promises);
  }
}