# OpenClaw Runtime

Docker-based execution environment for AI Company Builder agents.

## Build the Image

```bash
cd openclaw-runtime
docker build -t openclaw-runtime:latest .
```

## Verify the Image

```bash
docker images | grep openclaw
```

## Test the Image

```bash
docker run --rm openclaw-runtime:latest node --version
docker run --rm openclaw-runtime:latest git --version
docker run --rm openclaw-runtime:latest chromium-browser --version
```

## Usage

The OpenClaw runtime is automatically managed by the ContainerManager in the main application. Each AI company gets its own isolated container.

## Features

- Node.js 20 runtime
- Git version control
- Chromium browser for web automation
- TypeScript support
- Vercel CLI for deployments
- Isolated workspace per company
- Resource limits (CPU, memory, disk)
- Security isolation

## Security

- Non-root user (openclaw:1001)
- Resource limits enforced
- Network isolation configurable
- Read-only root filesystem option
- Volume-based data persistence
