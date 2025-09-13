# CI/CD Pipeline Documentation

## Overview

AI-Board uses GitHub Actions to automatically build and deploy the application to GitHub Pages when changes are pushed to the main branch.

## GitHub Pages Deployment

### Workflow Configuration

The deployment is handled by `.github/workflows/deploy-pages.yml` which:

1. **Triggers**: Runs on pushes to the `main` branch and can be manually triggered
2. **Build Job**: 
   - Checks out the code
   - Sets up Node.js 18 with npm caching
   - Installs dependencies with `npm ci`
   - Builds the application with `npm run build`
   - Uploads the built artifacts from the `dist/` directory
3. **Deploy Job**:
   - Deploys the artifacts to GitHub Pages
   - Provides the deployment URL

### Required Permissions

The workflow has the following permissions:
- `contents: read` - To checkout the repository code
- `pages: write` - To deploy to GitHub Pages
- `id-token: write` - For secure deployment authentication

### Build Process

The application is built using:
- **Node.js**: Version 18 (LTS)
- **Package Manager**: npm with `npm ci` for consistent builds
- **Build Command**: `npm run build` (runs `vue-tsc -b && vite build`)
- **Output**: Static files in the `dist/` directory

### Configuration

#### Vite Configuration
The `vite.config.ts` file is configured with:
```typescript
base: process.env.NODE_ENV === 'production' ? '/AI-Board/' : '/'
```
This ensures that assets are correctly referenced with the GitHub Pages repository path in production.

#### Repository Settings
To enable GitHub Pages deployment:
1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. The workflow will automatically deploy on the next push to main

## Deployment URL

Once deployed, the application will be available at:
`https://and1rew132.github.io/AI-Board/`

## Manual Deployment

The workflow can be manually triggered from the GitHub Actions tab using the "Run workflow" button.

## Build Status

The deployment status can be monitored in:
- GitHub Actions tab of the repository
- The Pages section in repository settings
- Build status badges (can be added to README if desired)

## Troubleshooting

### Common Issues
1. **Build Fails**: Check that all dependencies are correctly specified in `package.json`
2. **Assets Not Loading**: Verify the base URL configuration in `vite.config.ts`
3. **Deployment Fails**: Ensure GitHub Pages is enabled and source is set to "GitHub Actions"

### Local Testing
To test the production build locally:
```bash
npm run build
npm run preview
```

This will serve the built application locally on http://localhost:4173 with the same configuration as the production deployment.