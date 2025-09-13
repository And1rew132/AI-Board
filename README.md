# AI Board - Multi-Agent Project Management Tool

AI Board is a TypeScript Vue Vite application for orchestrating multiple AI agents, managing projects, tasks, and content, with deep integration to storage and external APIs (OpenAI, GitHub MCP, etc.).

## Features

- Visual management of multiple projects, agents, tasks, and content
- Connect to storage APIs (MinIO, S3, Azure, GCS, local)
- Integrate with OpenAI and GitHub MCP endpoints
- Agents can be autonomous, reactive, or collaborative
- Agents can prompt themselves, generate code/content, and manage files
- Projects support tasks (feature, bug, improvement, etc.) with comments, attachments, and statistics
- Kanban and list views for tasks
- GitHub integration for repo sync and MCP endpoints
- Modular, extensible architecture for new agent types and integrations

## Technologies

- TypeScript
- Vue 3 Composition API
- Vite
- Pinia (state management)

## Getting Started

1. Install dependencies:
    ```sh
    npm install
    ```
2. Start the development server:
    ```sh
    npm run dev
    ```

## Development Guidelines

- Use TypeScript for type safety
- Vue 3 Composition API for reactive components
- Modular architecture for extensibility
- Keep agent, project, and task logic in Pinia stores (`src/stores`)
- Use services (`src/services`) for API and integration logic
- Use types from `src/types` for all models and interfaces
- UI components should be modular and reusable

## Project Structure

- `src/components` - UI components (AgentManager, ProjectManager, TaskManager, etc.)
- `src/views` - Page-level views (Home, AgentManager, ProjectDetail, MCPManager)
- `src/stores` - Pinia stores for agents, projects, tasks
- `src/services` - API/integration logic (OpenAI, GitHub MCP, Storage, MCP)
- `src/types` - TypeScript interfaces and types for all models
- `src/router` - Vue Router setup
- `public/` - Static assets

## Key Concepts

- **Agents**: Can be autonomous, reactive, or collaborative. Each agent has capabilities (code generation, file management, API integration, etc.), config, and assigned projects/tasks. Autonomous agents can prompt themselves and execute tasks on intervals.
- **Projects**: Contain content (files, folders, notes), tasks (feature, bug, improvement, etc.), and assigned agents. Support storage integration and GitHub sync.
- **Tasks**: Jira-like tickets with status, priority, type, assignee, comments, attachments, and statistics. Kanban and list views available.
- **Integrations**: OpenAI for code/content generation, GitHub MCP for repo sync and tool endpoints, Storage (MinIO, S3, etc.) for file management.

## Best Improvements & Guidance for Coding Agents

1. **Agent Autonomy**: Implement agent routines for autonomous prompting and task execution. Use `runInterval` and `autonomousPrompting` configs.
2. **Task Management**: Ensure agents can create, update, and complete tasks, with support for dependencies and comments.
3. **Project Content**: Enable agents to create, modify, and organize project content (files, folders, notes, code).
4. **Integrations**: Expand support for new MCP endpoints, storage providers, and external APIs. Make integration logic modular.
5. **Collaboration**: Support collaborative workflows (agents modifying each other's work, approval flows, etc.).
6. **UI/UX**: Improve dashboard views for agents, projects, and tasks. Add more visual feedback for agent actions and statuses.
7. **Extensibility**: Make it easy to add new agent types, capabilities, and integrations by following modular patterns in stores/services/types.
8. **Security**: Store API keys and credentials securely. Avoid exposing sensitive data in the UI or localStorage.
9. **Testing**: Add unit and integration tests for stores, services, and components.
10. **Documentation**: Keep this README and code comments up to date for new features and integrations.

## For Coding Agents: What To Do

- Implement new agent types or capabilities by extending `Agent` and `AgentCapability` in `src/types` and updating logic in `src/stores/agents.ts`.
- Add new integrations by creating service classes in `src/services` and updating relevant stores/components.
- Improve project/task workflows by enhancing logic in `src/stores/projects.ts` and `src/stores/agents.ts`.
- Add new UI features by creating components in `src/components` and views in `src/views`.
- Always use types from `src/types` for new models and API responses.
- Document new features and update this README with usage and guidelines.

---
