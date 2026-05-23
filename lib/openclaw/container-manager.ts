/**
 * OpenClaw Container Manager
 *
 * Manages Docker containers for AI agent execution
 */

import Docker from 'dockerode';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ContainerStatus {
  running: boolean;
  status: string;
  startedAt: string;
  memory: number;
  cpu: number;
}

export interface ResourceUsage {
  memory: {
    used: number;
    limit: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    percentage: number;
  };
  disk: {
    used: number;
  };
}

export class ContainerManager {
  private docker: Docker;
  private containers: Map<string, string>; // companyId -> containerId

  constructor() {
    this.docker = new Docker();
    this.containers = new Map();
  }

  /**
   * Create a container for a company
   */
  async createContainer(companyId: string): Promise<string> {
    try {
      const container = await this.docker.createContainer({
        Image: 'openclaw-runtime:latest',
        name: `openclaw-${companyId}`,
        Hostname: `company-${companyId}`,
        WorkingDir: '/workspace',

        // Resource limits
        HostConfig: {
          Memory: 1024 * 1024 * 1024, // 1GB
          CpuQuota: 100000, // 100% CPU
          NetworkMode: 'bridge',

          // Mount volume for persistence
          Binds: [`openclaw-${companyId}:/workspace`],

          // Security
          ReadonlyRootfs: false, // Need write permissions

          // Auto restart
          RestartPolicy: {
            Name: 'unless-stopped',
            MaximumRetryCount: 0,
          },
        },

        // Environment variables
        Env: [`COMPANY_ID=${companyId}`, `NODE_ENV=production`],
      });

      await container.start();

      const containerId = container.id;
      this.containers.set(companyId, containerId);

      // Save to database
      await this.saveContainer(companyId, containerId);

      console.log(
        `[OpenClaw] Created container for company ${companyId}: ${containerId}`
      );

      return containerId;
    } catch (error: any) {
      console.error(`[OpenClaw] Failed to create container:`, error.message);
      throw error;
    }
  }

  /**
   * Execute a command in the container
   */
  async executeCommand(
    companyId: string,
    command: string[]
  ): Promise<ExecutionResult> {
    try {
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

        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString();
          // Docker output format: first 8 bytes are header
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
    } catch (error: any) {
      console.error(`[OpenClaw] Command execution failed:`, error.message);
      throw error;
    }
  }

  /**
   * Write a file to the container
   */
  async writeFile(
    companyId: string,
    path: string,
    content: string
  ): Promise<void> {
    // Escape single quotes in content
    const escapedContent = content.replace(/'/g, "'\\''");

    await this.executeCommand(companyId, [
      'sh',
      '-c',
      `echo '${escapedContent}' > ${path}`,
    ]);
  }

  /**
   * Read a file from the container
   */
  async readFile(companyId: string, path: string): Promise<string> {
    const result = await this.executeCommand(companyId, ['cat', path]);
    return result.stdout;
  }

  /**
   * Start a stopped container
   */
  async startContainer(companyId: string): Promise<void> {
    try {
      const containerId = await this.getContainerId(companyId);
      const container = this.docker.getContainer(containerId);
      await container.start();

      console.log(`[OpenClaw] Started container for company ${companyId}`);
    } catch (error: any) {
      console.error(`[OpenClaw] Failed to start container:`, error.message);
      throw error;
    }
  }

  /**
   * Stop a running container
   */
  async stopContainer(companyId: string): Promise<void> {
    try {
      const containerId = await this.getContainerId(companyId);
      const container = this.docker.getContainer(containerId);
      await container.stop();

      console.log(`[OpenClaw] Stopped container for company ${companyId}`);
    } catch (error: any) {
      console.error(`[OpenClaw] Failed to stop container:`, error.message);
      throw error;
    }
  }

  /**
   * Restart a container
   */
  async restartContainer(companyId: string): Promise<void> {
    try {
      const containerId = await this.getContainerId(companyId);
      const container = this.docker.getContainer(containerId);
      await container.restart();

      console.log(`[OpenClaw] Restarted container for company ${companyId}`);
    } catch (error: any) {
      console.error(`[OpenClaw] Failed to restart container:`, error.message);
      throw error;
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(companyId: string): Promise<void> {
    try {
      const containerId = await this.getContainerId(companyId);
      const container = this.docker.getContainer(containerId);

      await container.stop();
      await container.remove();

      this.containers.delete(companyId);

      console.log(`[OpenClaw] Removed container for company ${companyId}`);
    } catch (error: any) {
      console.error(`[OpenClaw] Failed to remove container:`, error.message);
      throw error;
    }
  }

  /**
   * Get container status
   */
  async getContainerStatus(companyId: string): Promise<ContainerStatus> {
    try {
      const containerId = await this.getContainerId(companyId);
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();

      return {
        running: info.State.Running,
        status: info.State.Status,
        startedAt: info.State.StartedAt,
        memory: info.HostConfig.Memory || 0,
        cpu: info.HostConfig.CpuQuota || 0,
      };
    } catch (error: any) {
      console.error(`[OpenClaw] Failed to get container status:`, error.message);
      throw error;
    }
  }

  /**
   * Get container resource usage
   */
  async getResourceUsage(companyId: string): Promise<ResourceUsage> {
    try {
      const containerId = await this.getContainerId(companyId);
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });

      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 1;

      return {
        memory: {
          used: memoryUsage,
          limit: memoryLimit,
          percentage: (memoryUsage / memoryLimit) * 100,
        },
        cpu: {
          usage: stats.cpu_stats.cpu_usage?.total_usage || 0,
          percentage: this.calculateCpuPercentage(stats),
        },
        disk: {
          used: stats.blkio_stats?.io_service_bytes_recursive?.[0]?.value || 0,
        },
      };
    } catch (error: any) {
      console.error(
        `[OpenClaw] Failed to get resource usage:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Health check for a container
   */
  async healthCheck(companyId: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(companyId, [
        'echo',
        'health-check',
      ]);

      return result.exitCode === 0 && result.stdout.includes('health-check');
    } catch (error) {
      console.error(
        `[OpenClaw] Health check failed for company ${companyId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get container ID for a company
   */
  private async getContainerId(companyId: string): Promise<string> {
    let containerId = this.containers.get(companyId);

    if (!containerId) {
      // Load from database
      const record = await this.loadContainer(companyId);
      if (record) {
        containerId = record.containerId;
        this.containers.set(companyId, containerId);
      } else {
        // Create new container
        containerId = await this.createContainer(companyId);
      }
    }

    return containerId;
  }

  /**
   * Save container ID to database
   */
  private async saveContainer(
    companyId: string,
    containerId: string
  ): Promise<void> {
    await db
      .update(companies)
      .set({
        config: sql`jsonb_set(COALESCE(config, '{}'::jsonb), '{containerId}', ${JSON.stringify(containerId)}::jsonb)`,
      })
      .where(eq(companies.id, companyId));
  }

  /**
   * Load container ID from database
   */
  private async loadContainer(
    companyId: string
  ): Promise<{ containerId: string } | null> {
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    });

    const config = company?.config as { containerId?: string } | undefined;

    if (!config?.containerId) {
      return null;
    }

    return { containerId: config.containerId };
  }

  /**
   * Calculate CPU percentage from stats
   */
  private calculateCpuPercentage(stats: any): number {
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage -
      stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta =
      stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;

    if (systemDelta > 0 && cpuDelta > 0) {
      return (cpuDelta / systemDelta) * 100;
    }

    return 0;
  }
}

// Singleton instance
export const containerManager = new ContainerManager();
