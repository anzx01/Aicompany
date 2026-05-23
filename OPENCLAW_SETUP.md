# OpenClaw Runtime Setup Guide

OpenClaw is the Docker-based execution environment for AI Company Builder agents. This guide will help you set up and configure OpenClaw.

## Prerequisites

- Docker installed and running
- Docker daemon accessible (Unix socket or TCP)
- At least 2GB RAM available for containers
- 10GB disk space for images and volumes

## Quick Start

### 1. Build the OpenClaw Runtime Image

```bash
cd openclaw-runtime
docker build -t openclaw-runtime:latest .
```

### 2. Verify the Image

```bash
docker images | grep openclaw
```

You should see:
```
openclaw-runtime   latest   <image-id>   <time>   <size>
```

### 3. Test the Image

```bash
# Test Node.js
docker run --rm openclaw-runtime:latest node --version

# Test Git
docker run --rm openclaw-runtime:latest git --version

# Test Chromium
docker run --rm openclaw-runtime:latest chromium-browser --version
```

### 4. Configure Environment Variables

Add to your `.env.local`:

```bash
# Docker Configuration
DOCKER_HOST="unix:///var/run/docker.sock"  # Linux/Mac
# DOCKER_HOST="npipe:////./pipe/docker_engine"  # Windows

# Resource Limits
OPENCLAW_MAX_MEMORY="1GB"
OPENCLAW_MAX_CPU="1"
OPENCLAW_MAX_DISK="5GB"
OPENCLAW_MAX_PROCESSES="100"

# Network Configuration
OPENCLAW_ALLOWED_DOMAINS="reddit.com,github.com,npmjs.com,vercel.com,anthropic.com,openai.com"

# Cleanup Policy
OPENCLAW_CLEANUP_DAYS="7"
OPENCLAW_IDLE_TIMEOUT="3600000"  # 1 hour in ms
```

## Usage

### Creating a Container

Containers are automatically created when a company is created or when an agent needs to execute code.

```typescript
import { containerManager } from '@/lib/openclaw';

// Create container for a company
const containerId = await containerManager.createContainer(companyId);
```

### Executing Commands

```typescript
// Execute a command
const result = await containerManager.executeCommand(companyId, [
  'node',
  '--version',
]);

console.log(result.stdout); // v20.x.x
console.log(result.exitCode); // 0
```

### File Operations

```typescript
// Write a file
await containerManager.writeFile(
  companyId,
  'src/hello.ts',
  'console.log("Hello, World!");'
);

// Read a file
const content = await containerManager.readFile(companyId, 'src/hello.ts');
```

### Container Lifecycle

```typescript
// Start a stopped container
await containerManager.startContainer(companyId);

// Stop a running container
await containerManager.stopContainer(companyId);

// Restart a container
await containerManager.restartContainer(companyId);

// Remove a container
await containerManager.removeContainer(companyId);
```

### Monitoring

```typescript
// Get container status
const status = await containerManager.getContainerStatus(companyId);
console.log(status.running); // true/false

// Get resource usage
const usage = await containerManager.getResourceUsage(companyId);
console.log(usage.memory.percentage); // 45.2

// Health check
const healthy = await containerManager.healthCheck(companyId);
```

## Agent Integration

### Software Engineer Agent

```typescript
import { containerManager } from '@/lib/openclaw';

export class SoftwareEngineerAgent {
  async developFeature(companyId: string, feature: string) {
    // Generate code
    const code = await this.generateCode(feature);

    // Write to container
    await containerManager.writeFile(
      companyId,
      `src/features/${feature}.ts`,
      code
    );

    // Compile
    const result = await containerManager.executeCommand(companyId, [
      'npx',
      'tsc',
      '--noEmit',
    ]);

    if (result.exitCode === 0) {
      // Commit
      await containerManager.executeCommand(companyId, ['git', 'add', '.']);
      await containerManager.executeCommand(companyId, [
        'git',
        'commit',
        '-m',
        `feat: implement ${feature}`,
      ]);
    }
  }
}
```

### Market Research Agent

```typescript
export class MarketResearchAgent {
  async researchReddit(companyId: string, topic: string) {
    // Create Puppeteer script
    const script = `
      const puppeteer = require('puppeteer');
      (async () => {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://www.reddit.com/search/?q=${topic}');
        // ... scraping logic
        await browser.close();
      })();
    `;

    // Write script
    await containerManager.writeFile(
      companyId,
      'scripts/reddit-research.js',
      script
    );

    // Execute
    const result = await containerManager.executeCommand(companyId, [
      'node',
      'scripts/reddit-research.js',
    ]);

    return JSON.parse(result.stdout);
  }
}
```

## Security

### Resource Limits

Each container has the following limits:
- **Memory**: 1GB
- **CPU**: 1 core (100%)
- **Processes**: 100 max
- **Disk**: 5GB (via volume)

### Network Isolation

Containers run in bridge network mode with configurable domain whitelist.

### File System Isolation

Each company gets its own Docker volume:
- Volume name: `openclaw-{companyId}`
- Mount point: `/workspace`
- Persistent across container restarts

### User Isolation

Containers run as non-root user:
- User: `openclaw`
- UID: 1001
- GID: 1001

## Troubleshooting

### Container Won't Start

```bash
# Check Docker daemon
docker ps

# Check image exists
docker images | grep openclaw

# Check logs
docker logs openclaw-{companyId}
```

### Permission Denied

```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER

# Restart Docker daemon
sudo systemctl restart docker
```

### Out of Memory

```bash
# Check container stats
docker stats openclaw-{companyId}

# Increase memory limit in .env
OPENCLAW_MAX_MEMORY="2GB"
```

### Container Not Responding

```typescript
// Health check
const healthy = await containerManager.healthCheck(companyId);

if (!healthy) {
  // Restart container
  await containerManager.restartContainer(companyId);
}
```

## Maintenance

### Cleanup Inactive Containers

```bash
# List all containers
docker ps -a | grep openclaw

# Remove stopped containers older than 7 days
docker container prune --filter "until=168h"
```

### Backup Container Data

```bash
# Backup a company's volume
docker run --rm \
  -v openclaw-{companyId}:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/{companyId}-$(date +%Y%m%d).tar.gz /data
```

### Monitor Resource Usage

```bash
# Real-time stats
docker stats $(docker ps --filter "name=openclaw" -q)

# Disk usage
docker system df
```

## Production Deployment

### Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock
      - OPENCLAW_MAX_MEMORY=1GB
      - OPENCLAW_MAX_CPU=1
```

### Kubernetes

For Kubernetes deployment, use DinD (Docker-in-Docker) sidecar pattern.

### Resource Planning

For N companies:
- **Memory**: N × 1GB + 2GB (host)
- **CPU**: N × 1 core + 2 cores (host)
- **Disk**: N × 5GB + 20GB (host)

Example for 10 companies:
- Memory: 12GB
- CPU: 12 cores
- Disk: 70GB

## API Reference

### tRPC Endpoints

```typescript
// Create container
await trpc.openclaw.createContainer.mutate({ companyId });

// Execute command
await trpc.openclaw.executeCommand.mutate({
  companyId,
  command: ['node', '--version'],
});

// Write file
await trpc.openclaw.writeFile.mutate({
  companyId,
  path: 'src/hello.ts',
  content: 'console.log("Hello");',
});

// Read file
const { content } = await trpc.openclaw.readFile.query({
  companyId,
  path: 'src/hello.ts',
});

// Get status
const status = await trpc.openclaw.getStatus.query({ companyId });

// Get resource usage
const usage = await trpc.openclaw.getResourceUsage.query({ companyId });

// Start/Stop/Restart
await trpc.openclaw.startContainer.mutate({ companyId });
await trpc.openclaw.stopContainer.mutate({ companyId });
await trpc.openclaw.restartContainer.mutate({ companyId });

// Remove
await trpc.openclaw.removeContainer.mutate({ companyId });

// Health check
const { healthy } = await trpc.openclaw.healthCheck.query({ companyId });
```

## Best Practices

1. **Always check health** before executing commands
2. **Use retry logic** for transient failures
3. **Log all operations** for debugging
4. **Monitor resource usage** to prevent overload
5. **Clean up** inactive containers regularly
6. **Backup data** before major operations
7. **Test in development** before production deployment

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review Docker logs: `docker logs openclaw-{companyId}`
- Check container status: `docker inspect openclaw-{companyId}`

---

**OpenClaw Runtime - Powering AI Agent Execution** 🚀
