# OpenClaw Runtime Dockerfile
# Provides isolated execution environment for AI agents

FROM node:20-alpine

# Install necessary tools
RUN apk add --no-cache \
    git \
    bash \
    curl \
    python3 \
    py3-pip \
    chromium \
    chromium-chromedriver

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create working directory
WORKDIR /workspace

# Install global tools
RUN npm install -g \
    typescript \
    ts-node \
    vercel \
    puppeteer

# Create non-root user
RUN addgroup -g 1001 -S openclaw && \
    adduser -S openclaw -u 1001 -G openclaw

# Set permissions
RUN chown -R openclaw:openclaw /workspace

USER openclaw

# Keep container running
CMD ["tail", "-f", "/dev/null"]
