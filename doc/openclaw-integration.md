# OpenClaw 集成指南（v0.2 自托管版）

> OpenClaw 是 AI Company Builder 的核心运行时环境，为所有类型的 AI 公司提供独立的 Docker 容器，允许 AI Agent 在隔离环境中自主执行代码开发、网页浏览、文件操作等任务

---

## 目录

1. [OpenClaw 简介](#openclaw-简介)
2. [运行时架构](#运行时架构)
3. [Docker 容器配置](#docker-容器配置)
4. [Agent 使用场景](#agent-使用场景)
5. [按公司类型的使用](#按公司类型的使用)
6. [安全隔离](#安全隔离)
7. [资源管理](#资源管理)
8. [最佳实践](#最佳实践)

---

## OpenClaw 简介

### 什么是 OpenClaw？

OpenClaw 是一个**自托管的 AI Agent 运行时环境**，为每个 AI 公司提供独立的 Docker 容器，在其中 Agent 可以：
- **自主编写代码**: 创建、修改、测试代码文件
- **执行命令**: 运行 npm、git、docker 等开发工具
- **浏览网页**: 使用 Puppeteer 进行网页自动化
- **管理项目**: 完整的文件系统访问和项目管理能力
- **平台集成**: 调用各种第三方平台 API

### v0.2 的关键特性

| 特性 | v0.1 (SDK) | v0.2 (运行时) |
|------|-----------|--------------|
| **部署方式** | 外部 API 服务 | 自托管 Docker 容器 |
| **成本** | 按使用量付费 | 零成本（自托管） |
| **隔离性** | 共享环境 | 每个公司独立容器 |
| **控制权** | 有限 | 完全控制 |
| **网络访问** | 受限 | 可配置 |
| **支持公司类型** | 仅开发 | 营销、内容、客服、开发 |

### 为什么改为运行时环境？

1. **零成本**: 无需支付外部 API 费用
2. **完全控制**: 自主管理容器生命周期
3. **更好的隔离**: 每个公司独立容器
4. **无限制**: 不受外部 API 限制
5. **数据安全**: 代码和数据不离开自己的服务器
6. **多类型支持**: 支持所有 4 种公司类型的运行需求

---

## 运行时架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                AI Company Builder (主应用)                │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  CEO Bot    │  │ Engineer Bot│  │ Launch Bot  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│         │                 │                 │            │
│         └─────────────────┼─────────────────┘            │
│                           │                              │
│                           ↓                              │
│              ┌─────────────────────────┐                 │
│              │  Container Manager      │                 │
│              │  - 容器生命周期管理      │                 │
│              │  - 资源监控              │                 │
│              │  - 命令执行接口          │                 │
│              └─────────────────────────┘                 │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │ Docker API
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                           │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  OpenClaw Container (Company A)                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │ Node.js    │  │ Puppeteer  │  │ Git/NPM    │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  │  /workspace/company-a/                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  OpenClaw Container (Company B)                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │ Node.js    │  │ Puppeteer  │  │ Git/NPM    │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  │  /workspace/company-b/                           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Container Manager 设计

```typescript
// src/lib/openclaw/container-manager.ts

import Docker from 'dockerode';

export class ContainerManager {
  private docker: Docker;
  private containers: Map<string, string>; // companyId -> containerId

  constructor() {
    this.docker = new Docker();
    this.containers = new Map();
  }

  // 为公司创建 OpenClaw 容器
  async createContainer(companyId: string): Promise<string> {
    const container = await this.docker.createContainer({
      Image: 'openclaw-runtime:latest',
      name: `openclaw-${companyId}`,
      Hostname: `company-${companyId}`,
      WorkingDir: '/workspace',

      // 资源限制
      HostConfig: {
        Memory: 1024 * 1024 * 1024, // 1GB
        CpuQuota: 100000, // 100% CPU
        NetworkMode: 'bridge', // 允许网络访问

        // 挂载卷（持久化代码）
        Binds: [
          `openclaw-${companyId}:/workspace`,
        ],

        // 只读根文件系统（安全）
        ReadonlyRootfs: false, // 需要写入权限
      },

      // 环境变量
      Env: [
        `COMPANY_ID=${companyId}`,
        `NODE_ENV=production`,
      ],

      // 自动重启
      RestartPolicy: {
        Name: 'unless-stopped',
      },
    });

    await container.start();

    const containerId = container.id;
    this.containers.set(companyId, containerId);

    // 保存到数据库
    await this.saveContainer(companyId, containerId);

    console.log(`[OpenClaw] Created container for company ${companyId}: ${containerId}`);

    return containerId;
  }

  // 在容器中执行命令
  async executeCommand(
    companyId: string,
    command: string[]
  ): Promise<ExecutionResult> {
    const containerId = await this.getContainerId(companyId);
    const container = this.docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: '/workspace',
    });

    const stream = await exec.start({ Detach: false });

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      stream.on('data', (chunk) => {
        const data = chunk.toString();
        // Docker 输出格式：前 8 字节是头部
        if (chunk[0] === 1) {
          stdout += data.slice(8);
        } else if (chunk[0] === 2) {
          stderr += data.slice(8);
        }
      });

      stream.on('end', async () => {
        const inspect = await exec.inspect();
        resolve({
          stdout,
          stderr,
          exitCode: inspect.ExitCode || 0,
        });
      });

      stream.on('error', reject);
    });
  }

  // 写入文件
  async writeFile(
    companyId: string,
    path: string,
    content: string
  ): Promise<void> {
    await this.executeCommand(companyId, [
      'sh',
      '-c',
      `echo '${content.replace(/'/g, "'\\''")}' > ${path}`,
    ]);
  }

  // 读取文件
  async readFile(companyId: string, path: string): Promise<string> {
    const result = await this.executeCommand(companyId, ['cat', path]);
    return result.stdout;
  }

  // 停止容器
  async stopContainer(companyId: string): Promise<void> {
    const containerId = await this.getContainerId(companyId);
    const container = this.docker.getContainer(containerId);
    await container.stop();

    console.log(`[OpenClaw] Stopped container for company ${companyId}`);
  }

  // 删除容器
  async removeContainer(companyId: string): Promise<void> {
    const containerId = await this.getContainerId(companyId);
    const container = this.docker.getContainer(containerId);

    await container.stop();
    await container.remove();

    this.containers.delete(companyId);

    console.log(`[OpenClaw] Removed container for company ${companyId}`);
  }

  // 获取容器状态
  async getContainerStatus(companyId: string): Promise<ContainerStatus> {
    const containerId = await this.getContainerId(companyId);
    const container = this.docker.getContainer(containerId);
    const info = await container.inspect();

    return {
      running: info.State.Running,
      status: info.State.Status,
      startedAt: info.State.StartedAt,
      memory: info.HostConfig.Memory,
      cpu: info.HostConfig.CpuQuota,
    };
  }

  private async getContainerId(companyId: string): Promise<string> {
    let containerId = this.containers.get(companyId);

    if (!containerId) {
      // 从数据库加载
      const record = await this.loadContainer(companyId);
      if (record) {
        containerId = record.containerId;
        this.containers.set(companyId, containerId);
      } else {
        // 创建新容器
        containerId = await this.createContainer(companyId);
      }
    }

    return containerId;
  }

  private async saveContainer(companyId: string, containerId: string): Promise<void> {
    // 保存到 Supabase
    const { db } = await import('@/lib/db/client');
    const { companies } = await import('@/lib/db/schema');
    const { eq, sql } = await import('drizzle-orm');

    await db
      .update(companies)
      .set({
        config: sql`jsonb_set(COALESCE(config, '{}'::jsonb), '{containerId}', ${JSON.stringify(containerId)}::jsonb)`,
      })
      .where(eq(companies.id, companyId));
  }

  private async loadContainer(companyId: string): Promise<{ containerId: string } | null> {
    // 从 Supabase 加载
    const { db } = await import('@/lib/db/client');
    const { companies } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    });

    if (!company?.config?.containerId) {
      return null;
    }

    return { containerId: company.config.containerId };
  }
}

// 单例
export const containerManager = new ContainerManager();
```

---

## Docker 容器配置

### Dockerfile (OpenClaw Runtime)

```dockerfile
# openclaw-runtime/Dockerfile

FROM node:20-alpine

# 安装必要工具
RUN apk add --no-cache \
    git \
    bash \
    curl \
    python3 \
    py3-pip \
    chromium \
    chromium-chromedriver

# 设置 Puppeteer 使用系统 Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 创建工作目录
WORKDIR /workspace

# 安装全局工具
RUN npm install -g \
    typescript \
    ts-node \
    vercel \
    @anthropic-ai/sdk \
    puppeteer

# 创建非 root 用户
RUN addgroup -g 1001 -S openclaw && \
    adduser -S openclaw -u 1001 -G openclaw

# 设置权限
RUN chown -R openclaw:openclaw /workspace

USER openclaw

# 保持容器运行
CMD ["tail", "-f", "/dev/null"]
```

### 构建镜像

```bash
# 构建 OpenClaw 运行时镜像
cd openclaw-runtime
docker build -t openclaw-runtime:latest .

# 验证镜像
docker images | grep openclaw
```

---

## Agent 使用场景

### 1. Software Engineer Bot

**使用 OpenClaw 容器进行代码开发**

```typescript
// src/lib/agents/engineer/engineer-agent.ts

export class SoftwareEngineerAgent extends BaseAgent {
  private container: ContainerManager;

  constructor(companyId: string) {
    super('engineer', AgentRole.SOFTWARE_ENGINEER, companyId, {
      model: 'claude-3-5-sonnet-20241022',
    });
    this.container = containerManager;
  }

  async developFeature(feature: string): Promise<void> {
    // 1. 生成代码
    const code = await this.generateCode(feature);

    // 2. 写入文件到容器
    await this.container.writeFile(
      this.companyId,
      `src/features/${feature}.ts`,
      code
    );

    // 3. 运行 TypeScript 编译检查
    const compileResult = await this.container.executeCommand(
      this.companyId,
      ['npx', 'tsc', '--noEmit']
    );

    // 4. 如果编译成功，提交到 Git
    if (compileResult.exitCode === 0) {
      await this.container.executeCommand(
        this.companyId,
        ['git', 'add', '.']
      );

      await this.container.executeCommand(
        this.companyId,
        ['git', 'commit', '-m', `feat: implement ${feature}`]
      );

      console.log(`[Engineer] Feature ${feature} implemented successfully`);
    } else {
      // 5. 如果失败，分析错误并重试
      console.error(`[Engineer] Compilation failed:`, compileResult.stderr);
      await this.fixErrors(code, compileResult.stderr);
    }
  }

  async runTests(): Promise<TestResult> {
    // 在容器中运行测试
    const result = await this.container.executeCommand(
      this.companyId,
      ['npm', 'test']
    );

    return {
      passed: result.exitCode === 0,
      output: result.stdout,
      errors: result.stderr,
    };
  }

  async installDependency(packageName: string): Promise<void> {
    await this.container.executeCommand(
      this.companyId,
      ['npm', 'install', packageName]
    );
  }
}
```

### 2. Market Research Bot

**使用 Puppeteer 浏览网页**

```typescript
// src/lib/agents/market/market-agent.ts

export class MarketResearchAgent extends BaseAgent {
  private container: ContainerManager;

  async researchReddit(topic: string): Promise<RedditInsights> {
    // 1. 创建 Puppeteer 脚本
    const script = `
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://www.reddit.com/search/?q=${encodeURIComponent(topic)}');

  // 等待内容加载
  await page.waitForSelector('.Post');

  // 提取帖子内容
  const posts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.Post')).map(post => ({
      title: post.querySelector('h3')?.textContent,
      content: post.querySelector('[data-test-id="post-content"]')?.textContent,
      upvotes: post.querySelector('[data-test-id="vote-count"]')?.textContent,
    }));
  });

  console.log(JSON.stringify(posts));

  await browser.close();
})();
    `;

    // 2. 写入脚本到容器
    await this.container.writeFile(
      this.companyId,
      'scripts/reddit-research.js',
      script
    );

    // 3. 执行脚本
    const result = await this.container.executeCommand(
      this.companyId,
      ['node', 'scripts/reddit-research.js']
    );

    // 4. 解析结果
    const posts = JSON.parse(result.stdout);
    const insights = await this.analyzeDiscussions(posts);

    // 5. 保存到记忆
    await this.memory.save({
      type: 'MARKET_INSIGHT',
      content: JSON.stringify(insights),
      importance: 8,
    });

    return insights;
  }
}
```

### 3. Launch Manager Bot

**使用容器自动化部署**

```typescript
// src/lib/agents/launch/launch-agent.ts

export class LaunchManagerAgent extends BaseAgent {
  private container: ContainerManager;

  async deployToVercel(): Promise<DeploymentResult> {
    // 1. 配置 Vercel 凭证
    await this.container.writeFile(
      this.companyId,
      '.vercel/project.json',
      JSON.stringify({
        projectId: process.env.VERCEL_PROJECT_ID,
        orgId: process.env.VERCEL_ORG_ID,
      })
    );

    // 2. 部署
    const result = await this.container.executeCommand(
      this.companyId,
      ['vercel', '--prod', '--yes', '--token', process.env.VERCEL_TOKEN]
    );

    // 3. 提取部署 URL
    const deployUrl = this.extractDeployUrl(result.stdout);

    console.log(`[Launch] Deployed to: ${deployUrl}`);

    return {
      success: result.exitCode === 0,
      url: deployUrl,
      logs: result.stdout,
    };
  }

  async pushToGitHub(): Promise<void> {
    // 配置 Git 凭证
    await this.container.executeCommand(
      this.companyId,
      ['git', 'config', 'user.name', 'AI Company Bot']
    );

    await this.container.executeCommand(
      this.companyId,
      ['git', 'config', 'user.email', 'bot@aicompany.com']
    );

    // 推送到 GitHub
    await this.container.executeCommand(
      this.companyId,
      ['git', 'push', 'origin', 'main']
    );
  }
}
```

---

## 按公司类型的使用

### 1. 营销公司（Marketing）

**主要用途**:
- 网页抓取和市场研究（Puppeteer）
- 社交媒体自动化（Twitter, LinkedIn API）
- 内容生成和发布
- 数据分析和报告生成

**典型 Agent 使用场景**:
```typescript
// Product Analyst - 市场研究
await container.executeCommand(companyId, [
  'node', 'scripts/scrape-reddit.js', '--topic', 'SaaS'
]);

// CMO - 发布营销内容
await container.executeCommand(companyId, [
  'node', 'scripts/post-to-twitter.js', '--content', 'New product launch!'
]);

// Content Creator - 生成营销素材
await container.writeFile(companyId, 'content/blog-post.md', generatedContent);
```

### 2. 内容公司（Content）

**主要用途**:
- 内容创作和编辑
- SEO 优化
- 多平台发布（Medium, YouTube, 博客）
- 内容日历管理

**典型 Agent 使用场景**:
```typescript
// Writer - 创作内容
await container.writeFile(companyId, 'articles/new-post.md', articleContent);

// SEO Specialist - 优化内容
await container.executeCommand(companyId, [
  'node', 'scripts/seo-analysis.js', '--file', 'articles/new-post.md'
]);

// Social Media Manager - 发布到多平台
await container.executeCommand(companyId, [
  'node', 'scripts/publish-to-medium.js', '--article', 'articles/new-post.md'
]);
```

### 3. 客服公司（Customer Service）

**主要用途**:
- 工单处理和响应
- 知识库管理
- 客户数据分析
- 自动化回复生成

**典型 Agent 使用场景**:
```typescript
// Ticket Handler - 处理工单
await container.executeCommand(companyId, [
  'node', 'scripts/process-tickets.js', '--priority', 'high'
]);

// KB Manager - 更新知识库
await container.writeFile(companyId, 'kb/faq-new.md', faqContent);

// QA Specialist - 质量检查
await container.executeCommand(companyId, [
  'node', 'scripts/qa-check.js', '--responses', 'last-24h'
]);
```

### 4. 开发公司（Development）

**主要用途**:
- 代码开发和测试
- Git 版本控制
- CI/CD 自动化
- 项目部署

**典型 Agent 使用场景**:
```typescript
// Engineer - 开发功能
await container.writeFile(companyId, 'src/features/auth.ts', codeContent);
await container.executeCommand(companyId, ['npx', 'tsc', '--noEmit']);

// QA Engineer - 运行测试
await container.executeCommand(companyId, ['npm', 'test']);

// DevOps - 部署应用
await container.executeCommand(companyId, [
  'vercel', '--prod', '--yes', '--token', process.env.VERCEL_TOKEN
]);
```

---

## 安全隔离

### 1. 资源限制

```typescript
// 为每个容器设置资源限制
const container = await docker.createContainer({
  Image: 'openclaw-runtime:latest',
  HostConfig: {
    Memory: 1024 * 1024 * 1024, // 1GB 内存
    CpuQuota: 100000, // 100% CPU（1 核心）
    PidsLimit: 100, // 最多 100 个进程
    DiskQuota: 5 * 1024 * 1024 * 1024, // 5GB 磁盘
  },
});
```

### 2. 网络隔离

```typescript
// 限制可访问的域名
const allowedDomains = [
  'reddit.com',
  'github.com',
  'npmjs.com',
  'vercel.com',
  'anthropic.com',
  'openai.com',
];

// 在容器中配置网络规则
await container.executeCommand(companyId, [
  'sh',
  '-c',
  `echo '${allowedDomains.join('\n')}' > /etc/hosts.allow`,
]);
```

### 3. 文件系统隔离

```typescript
// 每个公司独立的数据卷
const volume = await docker.createVolume({
  Name: `openclaw-${companyId}`,
  Driver: 'local',
  DriverOpts: {
    type: 'none',
    device: `/var/lib/openclaw/${companyId}`,
    o: 'bind',
  },
});
```

### 4. 代码审查

```typescript
// 在执行前审查代码
async function reviewCode(code: string): Promise<boolean> {
  const dangerousPatterns = [
    /rm\s+-rf\s+\//,  // 删除根目录
    /:\(\)\{.*\}/,     // Fork 炸弹
    /eval\(/,          // eval 执行
    /exec\(/,          // exec 执行
    /child_process/,   // 子进程
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      console.warn(`[Security] Dangerous pattern detected: ${pattern}`);
      return false;
    }
  }

  return true;
}
```

---

## 资源管理

### 容器生命周期

```typescript
// 容器生命周期管理

// 1. 创建容器（公司创建时）
await containerManager.createContainer(companyId);

// 2. 心跳时唤醒容器
const status = await containerManager.getContainerStatus(companyId);
if (!status.running) {
  await containerManager.startContainer(companyId);
}

// 3. 空闲时停止容器（节省资源）
if (idleTime > 1 * 60 * 60 * 1000) { // 1 小时
  await containerManager.stopContainer(companyId);
}

// 4. 公司归档时删除容器
await containerManager.removeContainer(companyId);
```

### 资源监控

```typescript
// 监控容器资源使用

async function monitorContainerResources(companyId: string): Promise<ResourceUsage> {
  const containerId = await containerManager.getContainerId(companyId);
  const container = docker.getContainer(containerId);
  const stats = await container.stats({ stream: false });

  return {
    memory: {
      used: stats.memory_stats.usage,
      limit: stats.memory_stats.limit,
      percentage: (stats.memory_stats.usage / stats.memory_stats.limit) * 100,
    },
    cpu: {
      usage: stats.cpu_stats.cpu_usage.total_usage,
      percentage: calculateCpuPercentage(stats),
    },
    disk: {
      used: stats.blkio_stats.io_service_bytes_recursive?.[0]?.value || 0,
    },
  };
}

// 定期检查资源使用
setInterval(async () => {
  const companies = await getActiveCompanies();

  for (const company of companies) {
    const usage = await monitorContainerResources(company.id);

    // 如果资源使用超过阈值，发送告警
    if (usage.memory.percentage > 90) {
      await sendAlert(`Company ${company.id} memory usage: ${usage.memory.percentage}%`);
    }
  }
}, 5 * 60 * 1000); // 每 5 分钟检查一次
```

### 自动清理

```typescript
// 自动清理不活跃的容器

async function cleanupInactiveContainers(): Promise<void> {
  const containers = await docker.listContainers({ all: true });

  for (const containerInfo of containers) {
    const container = docker.getContainer(containerInfo.Id);
    const inspect = await container.inspect();

    // 如果容器停止超过 7 天，删除
    const stoppedAt = new Date(inspect.State.FinishedAt);
    const daysStopped = (Date.now() - stoppedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysStopped > 7) {
      console.log(`[Cleanup] Removing inactive container: ${containerInfo.Id}`);
      await container.remove();
    }
  }
}

// 每天凌晨 3 点清理
cron.schedule('0 3 * * *', cleanupInactiveContainers);
```

---

## 最佳实践

### 1. 错误处理

```typescript
async function executeWithRetry(
  companyId: string,
  command: string[],
  maxRetries: number = 3
): Promise<ExecutionResult> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await containerManager.executeCommand(companyId, command);

      if (result.exitCode === 0) {
        return result;
      }

      console.warn(`[Retry ${i + 1}/${maxRetries}] Command failed:`, result.stderr);

      // 指数退避
      await sleep(1000 * Math.pow(2, i));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }

  throw new Error('Max retries exceeded');
}
```

### 2. 日志记录

```typescript
// 记录所有容器操作

async function executeWithLogging(
  companyId: string,
  command: string[]
): Promise<ExecutionResult> {
  console.log(`[OpenClaw] Executing command:`, command.join(' '));

  const startTime = Date.now();
  const result = await containerManager.executeCommand(companyId, command);
  const duration = Date.now() - startTime;

  console.log(`[OpenClaw] Command completed:`, {
    exitCode: result.exitCode,
    duration,
    outputLength: result.stdout.length,
  });

  // 保存到数据库
  await saveExecutionLog({
    companyId,
    command: command.join(' '),
    exitCode: result.exitCode,
    duration,
    stdout: result.stdout.substring(0, 1000), // 只保存前 1000 字符
    stderr: result.stderr.substring(0, 1000),
  });

  return result;
}
```

### 3. 容器健康检查

```typescript
// 定期检查容器健康状态

async function healthCheck(companyId: string): Promise<boolean> {
  try {
    // 执行简单命令测试容器是否响应
    const result = await containerManager.executeCommand(
      companyId,
      ['echo', 'health-check'],
      { timeout: 5000 }
    );

    return result.exitCode === 0 && result.stdout.includes('health-check');
  } catch (error) {
    console.error(`[Health Check] Container ${companyId} unhealthy:`, error);
    return false;
  }
}

// 每 5 分钟检查一次
setInterval(async () => {
  const companies = await getActiveCompanies();

  for (const company of companies) {
    const healthy = await healthCheck(company.id);

    if (!healthy) {
      // 尝试重启容器
      await containerManager.restartContainer(company.id);
    }
  }
}, 5 * 60 * 1000);
```

### 4. 数据持久化

```typescript
// 定期备份容器数据

async function backupContainerData(companyId: string): Promise<void> {
  const volumeName = `openclaw-${companyId}`;

  // 创建备份
  await docker.run(
    'alpine',
    ['tar', 'czf', `/backup/${companyId}-${Date.now()}.tar.gz`, '/data'],
    process.stdout,
    {
      HostConfig: {
        Binds: [
          `${volumeName}:/data:ro`,
          '/backups:/backup',
        ],
      },
    }
  );

  console.log(`[Backup] Container data backed up for company ${companyId}`);
}

// 每天凌晨 2 点备份
cron.schedule('0 2 * * *', async () => {
  const companies = await getAllCompanies();

  for (const company of companies) {
    await backupContainerData(company.id);
  }
});
```

---

## 环境变量

```bash
# .env

# Docker 配置
DOCKER_HOST="unix:///var/run/docker.sock"

# 资源限制
OPENCLAW_MAX_MEMORY="1GB"
OPENCLAW_MAX_CPU="1"
OPENCLAW_MAX_DISK="5GB"
OPENCLAW_MAX_PROCESSES="100"

# 网络配置
OPENCLAW_ALLOWED_DOMAINS="reddit.com,github.com,npmjs.com,vercel.com"

# 清理策略
OPENCLAW_CLEANUP_DAYS="7"  # 删除停止超过 7 天的容器
OPENCLAW_IDLE_TIMEOUT="3600000"  # 1 小时空闲后停止容器
```

---

## 总结

### v0.2 OpenClaw 运行时的优势

1. **零成本**: 无需支付外部 API 费用
2. **完全控制**: 自主管理容器生命周期和资源
3. **更好的隔离**: 每个公司独立容器，互不影响
4. **无限制**: 不受外部 API 的速率限制和功能限制
5. **数据安全**: 所有代码和数据都在自己的服务器上
6. **多类型支持**: 支持营销、内容、客服、开发 4 种公司类型

### 关键技术点

- **Docker 容器管理**: 使用 Dockerode 管理容器生命周期
- **资源限制**: 内存、CPU、磁盘、进程数限制
- **安全隔离**: 网络隔离、文件系统隔离、代码审查
- **资源监控**: 实时监控容器资源使用
- **自动清理**: 定期清理不活跃的容器
- **数据持久化**: 使用 Docker 卷持久化代码和数据
- **多类型适配**: 为不同公司类型提供定制化运行环境

### 下一步

1. 构建 OpenClaw 运行时镜像
2. 实现 ContainerManager
3. 在 Agent 中集成容器管理
4. 配置资源限制和安全策略
5. 设置监控和告警
6. 为 4 种公司类型配置专属工具和依赖

---

**v0.2 自托管版 - OpenClaw 运行时是所有 AI 公司的核心执行引擎！** 🚀

