# Issue: Add Docker Development Environment and CI/CD Pipeline

## Priority: Medium

## Description
The project lacks containerization and automated CI/CD pipeline, making it difficult to ensure consistent development environments and automated deployments. Adding Docker and GitHub Actions will improve the development experience and deployment reliability.

## Current Issues
- No standardized development environment
- Manual deployment process
- No continuous integration
- Environment inconsistencies between developers
- No automated testing in CI
- No automated builds and releases

## Proposed Solution

### 1. Docker Development Environment

Create `Dockerfile`:
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create `Dockerfile.dev`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose development port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  ai-board:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - VITE_OPENAI_ENABLED=true
      - VITE_STORAGE_PROVIDER=minio
      - VITE_MINIO_ENDPOINT=http://minio:9000
      - VITE_MINIO_BUCKET=ai-board
    depends_on:
      - minio

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin123;
      /usr/bin/mc mb myminio/ai-board --ignore-existing;
      /usr/bin/mc policy set public myminio/ai-board;
      "

volumes:
  minio_data:
```

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  ai-board:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  # Production monitoring (optional)
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    ports:
      - "9113:9113"
    environment:
      - SCRAPE_URI=http://ai-board/nginx_status
    depends_on:
      - ai-board
```

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Nginx status for monitoring
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

### 2. GitHub Actions CI/CD Pipeline

Create `.github/workflows/ci.yml`:
```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18'

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run type check
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:coverage

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright browsers
      run: npx playwright install --with-deps

    - name: Build application
      run: npm run build

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Upload E2E test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-test]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/

  docker-build:
    runs-on: ubuntu-latest
    needs: [build]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ secrets.DOCKER_USERNAME }}/ai-board
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
```

Create `.github/workflows/release.yml`:
```yaml
name: Release Pipeline

on:
  push:
    tags:
      - 'v*'

env:
  NODE_VERSION: '18'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm run test

    - name: Build application
      run: npm run build

    - name: Create GitHub Release
      uses: softprops/action-gh-release@v1
      with:
        files: |
          dist/**/*
        generate_release_notes: true
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

    - name: Deploy to production
      run: |
        echo "Deploy to production environment"
        # Add your deployment steps here
```

### 3. Development Scripts

Update `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.vue",
    "lint:fix": "eslint src --ext .ts,.vue --fix",
    "format": "prettier --write src/**/*.{ts,vue,js,json}",
    "type-check": "vue-tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui", 
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "docker:dev": "docker-compose up --build",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up --build",
    "docker:down": "docker-compose down",
    "docker:clean": "docker-compose down -v --rmi all"
  }
}
```

Create `Makefile`:
```makefile
.PHONY: help dev build test clean docker-dev docker-prod

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@egrep '^(.+)\s*:.*##\s*(.+)' $(MAKEFILE_LIST) | column -t -c 2 -s ':#'

dev: ## Start development server
	npm run dev

install: ## Install dependencies
	npm install

build: ## Build for production
	npm run build

test: ## Run all tests
	npm run lint
	npm run type-check
	npm run test
	npm run test:e2e

clean: ## Clean build artifacts and dependencies
	rm -rf dist node_modules coverage

docker-dev: ## Start development environment with Docker
	docker-compose up --build

docker-prod: ## Start production environment with Docker
	docker-compose -f docker-compose.prod.yml up --build

docker-down: ## Stop Docker containers
	docker-compose down

docker-clean: ## Clean Docker containers and volumes
	docker-compose down -v --rmi all

lint: ## Run linter
	npm run lint

format: ## Format code
	npm run format

security-audit: ## Run security audit
	npm audit
	docker run --rm -v "$(PWD):/app" aquasec/trivy fs /app
```

### 4. Documentation Updates

Create `docs/deployment.md`:
```markdown
# Deployment Guide

## Development Environment

### Using Docker (Recommended)
```bash
# Start development environment
make docker-dev

# Or using docker-compose directly
docker-compose up --build
```

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Deployment

### Using Docker
```bash
# Build and run production container
make docker-prod

# Or using docker-compose
docker-compose -f docker-compose.prod.yml up --build
```

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy dist/ folder to your web server
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `VITE_OPENAI_ENABLED`: Enable OpenAI integration
- `VITE_STORAGE_PROVIDER`: Storage provider (local, minio, s3)
- `VITE_MINIO_ENDPOINT`: MinIO endpoint URL
- `VITE_MINIO_BUCKET`: MinIO bucket name

## CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

- **CI Pipeline**: Runs on every push and PR
- **Release Pipeline**: Runs on tag creation
- **Security Scanning**: Runs vulnerability scans

### Required Secrets

Configure these secrets in your GitHub repository:

- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
```

## Benefits
- Consistent development environment
- Automated testing and deployment
- Container-based deployment
- Security scanning
- Multi-platform Docker builds
- Production-ready configuration

## Acceptance Criteria
- [ ] Docker development environment working
- [ ] Docker production build working
- [ ] GitHub Actions CI pipeline implemented
- [ ] GitHub Actions release pipeline implemented
- [ ] Security scanning integrated
- [ ] Documentation updated
- [ ] Makefile for common tasks
- [ ] Multi-platform Docker builds
- [ ] Health checks implemented
- [ ] Nginx configuration optimized

## Estimated Effort
Large (8-12 hours)