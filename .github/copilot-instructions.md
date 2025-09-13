# AI Board - Multi-Agent Project Management Tool

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

AI Board is a TypeScript Vue Vite application for orchestrating multiple AI agents, managing projects, tasks, and content with deep integration to storage and external APIs (OpenAI, GitHub MCP, etc.).

## Working Effectively

### Prerequisites and Environment Setup
- Node.js 18+ (tested with Node.js 20.19.5)
- npm 8+ (tested with npm 10.8.2) 
- No additional system dependencies required

### Bootstrap, Build, and Test Commands
- `npm install` -- installs dependencies in ~8 seconds. Always run this first.
- `npm run build` -- compiles TypeScript and builds for production in ~8 seconds. NEVER CANCEL. Set timeout to 30+ seconds minimum.
- `npm run dev` -- starts development server in ~350ms on http://localhost:5173/
- `npm run preview` -- serves production build on http://localhost:4173/ for testing

### Development Workflow
ALWAYS run the bootstrapping steps first:
1. `npm install`
2. `npm run dev` for development, or `npm run build` then `npm run preview` for production testing

## Validation and Testing

### Manual Validation Requirements
ALWAYS test complete user scenarios after making changes:
1. **Project Management Flow**: Create a new project → Add description → Verify it appears in project list → Test project filtering
2. **Agent Management Flow**: Navigate to /agents → Test agent templates → Verify agent creation forms work
3. **MCP Integration Flow**: Navigate to /mcp → Test OpenAI/GitHub/Custom integration tabs → Verify connection status displays
4. **Navigation Flow**: Test all nav links (Projects, Agents, Business Center, MCP Integrations) work correctly

### No Testing Infrastructure
- Currently no unit tests, integration tests, or linting configured
- Manual validation through browser testing is the primary validation method
- Application should load without console errors and all navigation should work

## Build Output and Deployment
- Build creates `dist/` directory with static assets
- Build output: ~434KB total (index.html, CSS ~85KB gzipped to 13KB, JS ~348KB gzipped to 107KB)
- No special deployment requirements - standard static site hosting

## Project Architecture

### Key Technologies
- **TypeScript** - All code is strictly typed
- **Vue 3 Composition API** - Reactive components and state management  
- **Vite** - Fast development and optimized builds
- **Pinia** - State management with persistence
- **Vue Router** - Client-side routing

### Source Code Structure
```
src/
├── components/     # UI components (AgentManager, ProjectManager, TaskManager)
├── views/         # Page-level views (Home, AgentManager, ProjectDetail, MCPManager)  
├── stores/        # Pinia stores (agents.ts, projects.ts, orchestration.ts)
├── services/      # API/integration logic (openai.ts, github-mcp.ts, storage.ts, mcp.ts, orchestration.ts)
├── types/         # TypeScript interfaces (index.ts - comprehensive type definitions)
├── router/        # Vue Router configuration
├── ui/           # Shared UI utilities
└── main.ts       # Application entry point
```

### Core Application Concepts
- **Projects**: Contain content (files, folders, notes), tasks (Jira-like tickets), and assigned agents
- **Agents**: Can be autonomous, reactive, or collaborative with capabilities (code generation, file management, API integration)
- **Tasks**: Support status tracking, priority, type, assignee, comments, attachments
- **Integrations**: OpenAI for generation, GitHub MCP for repo sync, Storage (MinIO, S3, etc.)
- **Orchestration**: Workflow management and agent communication

## Environment Configuration

### Required Environment Setup
Copy `.env.example` to `.env.local` and configure:
- `VITE_OPENAI_ENABLED=true` - Enable OpenAI integration
- `VITE_STORAGE_PROVIDER=local` - Storage provider (local/minio/s3/azure/gcs)
- `VITE_GITHUB_MCP_ENABLED=true` - Enable GitHub MCP integration
- **NEVER commit .env.local or real API keys**

### Storage Integration
- Supports MinIO, S3, Azure, GCS, and local storage
- Configure endpoint and credentials in environment variables
- Storage logic in `src/services/storage.ts`

## Development Guidelines

### Code Standards
- Use TypeScript for all new code with strict typing
- Follow Vue 3 Composition API patterns for components
- Import types from `src/types/index.ts` for all models and interfaces
- Keep components focused and reusable
- Use Pinia stores for state management (`src/stores/`)
- Place API/integration logic in services (`src/services/`)

### Key Development Patterns
- **Adding New Agent Types**: Extend `Agent` and `AgentCapability` in `src/types/index.ts`, update logic in `src/stores/agents.ts`
- **New Integrations**: Create service classes in `src/services/`, update relevant stores/components
- **Project/Task Features**: Enhance logic in `src/stores/projects.ts` and `src/stores/agents.ts`
- **UI Components**: Create in `src/components/`, use existing UI patterns from other components

### Common Tasks Reference
Based on frequently run commands, here are key outputs to reference:

#### Repository Root Contents
```
.env.example          # Environment configuration template
.github/              # GitHub configuration and instructions
.gitignore           # Git ignore rules  
.vscode/             # VSCode workspace settings
CONTRIBUTING.md      # Contribution guidelines
LICENSE              # MIT license
README.md            # Project documentation
docs/                # Additional documentation and improvement guides
index.html           # Main HTML entry point
package.json         # Node.js dependencies and scripts
public/              # Static assets
src/                 # Source code
tsconfig.*.json      # TypeScript configuration
vite.config.ts       # Vite build configuration
```

#### package.json Scripts Summary
```json
{
  "scripts": {
    "dev": "vite",                          // Development server
    "build": "vue-tsc -b && vite build",    // Production build  
    "preview": "vite preview"               // Preview production build
  }
}
```

## Timing Expectations

### Development Commands (NEVER CANCEL - Wait for completion)
- `npm install`: ~8 seconds - Set timeout to 60+ seconds  
- `npm run build`: ~8 seconds - Set timeout to 60+ seconds
- `npm run dev`: Starts in ~350ms - Set timeout to 30+ seconds
- `npm run preview`: Starts in ~1-2 seconds - Set timeout to 30+ seconds

### Browser Testing
- Application loads in <1 second after server starts
- All navigation should be instant (client-side routing)
- Project creation and agent management should be responsive

## Troubleshooting

### Common Issues
- **Build fails**: Ensure Node.js 18+ is installed, run `npm install` first
- **Dev server won't start**: Check if port 5173 is available, try `npm run dev -- --port 3000`
- **TypeScript errors**: Run `npm run build` to see compilation errors, check `src/types/index.ts` for type definitions
- **Missing dependencies**: Always run `npm install` after pulling changes

### No CI/CD Pipeline
- Currently no GitHub Actions or automated testing
- Manual validation is required for all changes
- Build locally before committing: `npm run build`

---

For coding agents: Focus on type safety, component reusability, and integration extensibility. Always test UI changes manually through complete user workflows. Document new features in README.md and update type definitions in `src/types/index.ts`.