#!/bin/bash

# GitHub CLI Script to Create AI-Board UI/UX Improvement Issues
# Prerequisites: 
# 1. Install GitHub CLI: https://cli.github.com/
# 2. Authenticate: gh auth login
# 3. Run from AI-Board repository root

set -e

REPO="And1rew132/AI-Board"
ASSIGNEE="coding-agent"  # Update with actual GitHub username

echo "🚀 Creating AI-Board UI/UX Improvement Issues..."
echo "Repository: $REPO"
echo "Assignee: $ASSIGNEE"
echo ""

# Function to create an issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    
    echo "Creating issue: $title"
    
    gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body "$body" \
        --label "$labels" \
        --assignee "$ASSIGNEE"
    
    echo "✅ Created: $title"
    echo ""
}

# Issue 1: Split AgentManager into Focused Sub-Components
create_issue \
"Split AgentManager into Focused Sub-Components" \
"## 🎯 Objective
Split the complex AgentManager component into focused sub-components for better user experience and maintainability.

## 🔍 Current Issues
- Single complex component managing agent list, creation, editing, and monitoring
- Sub-routes (\`/agents/performance\`, \`/agents/training\`) currently reuse the main component
- Difficult navigation between different agent management functions
- Performance issues due to loading all functionality at once

## 💡 Proposed Solution
Split into dedicated components:

### 1. Agent Overview (\`/agents\`)
- Agent list with cards/table view
- Basic info and quick actions
- Agent creation/editing dialogs
- Search and filtering capabilities

### 2. Agent Performance (\`/agents/performance\`)
- Performance metrics and analytics
- Task completion rates
- Resource utilization charts
- Performance history and trends

### 3. Agent Training (\`/agents/training\`)
- Training configuration interface
- Model management
- Learning progress tracking
- Training data management

## ✅ Acceptance Criteria
- [ ] Create dedicated \`AgentPerformance.vue\` component
- [ ] Create dedicated \`AgentTraining.vue\` component  
- [ ] Refactor \`AgentManager.vue\` to focus on overview/list functionality
- [ ] Update router configuration for proper component mapping
- [ ] Implement navigation tabs/breadcrumbs between sections
- [ ] Ensure consistent design language across all agent components
- [ ] Add proper loading states for each section
- [ ] Implement data persistence between section switches

## 🛠️ Technical Details
- Components should share common agent data through Pinia store
- Implement lazy loading for performance optimization
- Use TypeScript interfaces from \`src/types/index.ts\`
- Follow existing UI patterns from \`src/ui/components\`

## 📊 Success Metrics
- Reduced component complexity (LOC per component)
- Improved page load times
- Better user navigation experience
- Easier maintenance and testing" \
"enhancement,ui-improvement,agents,high-priority"

# Issue 2: Split MCPManager into Specialized Integration Sections
create_issue \
"Split MCPManager into Specialized Integration Sections" \
"## 🎯 Objective
Split the MCPManager into specialized sections for different integration types to improve organization and user experience.

## 🔍 Current Issues
- Complex tab-based interface managing all integration types
- Sub-routes (\`/mcp/apis\`, \`/mcp/webhooks\`) reuse the main component
- Different integration types have unique requirements and UI needs
- Difficult to find specific integration settings

## 💡 Proposed Solution
Split into dedicated components:

### 1. Integration Dashboard (\`/mcp\`)
- Overview of all active connections
- Connection status monitoring
- Quick statistics and health checks
- Integration setup wizard

### 2. API Management (\`/mcp/apis\`)
- API endpoint configuration
- Authentication management
- Request/response testing interface
- Rate limiting and quota monitoring

### 3. Webhook Management (\`/mcp/webhooks\`)
- Webhook endpoint setup
- Event type configuration
- Webhook logs and debugging
- Retry policies and error handling

## ✅ Acceptance Criteria
- [ ] Create dedicated \`MCPApiManager.vue\` component
- [ ] Create dedicated \`MCPWebhookManager.vue\` component
- [ ] Refactor \`MCPManager.vue\` to focus on dashboard/overview functionality
- [ ] Update router configuration for proper component mapping
- [ ] Implement consistent navigation between integration sections
- [ ] Add specialized forms and interfaces for each integration type
- [ ] Add real-time connection status monitoring
- [ ] Implement integration testing capabilities

## 🛠️ Technical Details
- Use MCP service classes from \`src/services/\`
- Implement WebSocket connections for real-time status
- Add form validation for integration configurations
- Follow existing integration patterns

## 📊 Success Metrics
- Improved integration setup completion rate
- Reduced support tickets for integration issues
- Better monitoring and debugging capabilities" \
"enhancement,ui-improvement,integrations,high-priority"

# Issue 3: Split ProjectDetail into Dedicated Tab Views
create_issue \
"Split ProjectDetail into Dedicated Tab Views" \
"## 🎯 Objective
Split the complex ProjectDetail component into dedicated views for better performance and maintainability.

## 🔍 Current Issues
- Single large component handling overview, tasks, content, and agent management
- All functionality loaded at once, affecting performance
- Difficult to maintain and extend individual sections
- Poor user experience with large component loading times

## 💡 Proposed Solution
Split into dedicated components with sub-routing:

### 1. Project Overview (\`/project/:id\`)
- Basic project information and description
- Status and progress indicators
- Recent activity feed
- Quick action buttons

### 2. Task Management (\`/project/:id/tasks\`)
- Kanban board or list view
- Task creation and editing
- Task filtering and search
- Bulk task operations

### 3. Content Management (\`/project/:id/content\`)
- File and folder management
- Upload and download capabilities
- Version control integration
- Content search and organization

### 4. Agent Assignment (\`/project/:id/agents\`)
- Agent assignment interface
- Agent performance monitoring for project
- Agent task distribution
- Communication tools

## ✅ Acceptance Criteria
- [ ] Create \`ProjectOverview.vue\` component
- [ ] Create \`ProjectTasks.vue\` component
- [ ] Create \`ProjectContent.vue\` component
- [ ] Create \`ProjectAgents.vue\` component
- [ ] Implement sub-routing for project sections
- [ ] Add proper navigation tabs with active state indicators
- [ ] Ensure data persistence between tab switches
- [ ] Implement lazy loading for each section
- [ ] Add breadcrumb navigation

## 🛠️ Technical Details
- Use Vue Router nested routes
- Implement route guards for project access
- Share project data through props and store
- Add route transitions for smooth UX

## 📊 Success Metrics
- Reduced initial page load time
- Improved component maintainability
- Better user navigation within projects" \
"enhancement,ui-improvement,projects,high-priority"

echo "🎉 All issues created successfully!"
echo ""
echo "📋 Summary:"
echo "- 10 GitHub issues created"
echo "- Assigned to: $ASSIGNEE"
echo "- Repository: $REPO"
echo ""
echo "🔗 View issues: https://github.com/$REPO/issues"
echo ""
echo "📝 Next steps:"
echo "1. Review and update issue assignees if needed"
echo "2. Set up project board to track progress"
echo "3. Begin implementation with high-priority issues"