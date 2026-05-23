import { describe, it, expect, beforeEach } from 'vitest';
import { AgentScheduler } from '@/lib/agent/scheduler';
import { AgentExecutor } from '@/lib/agent/executor';

describe('AgentScheduler', () => {
  let scheduler: AgentScheduler;

  beforeEach(() => {
    scheduler = new AgentScheduler();
  });

  it('schedules agent tasks correctly', async () => {
    const task = {
      id: 'test-task-1',
      agentId: 'agent-1',
      type: 'analysis',
      priority: 1,
      status: 'pending',
    };

    await scheduler.scheduleTask(task);

    const tasks = scheduler.getPendingTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('test-task-1');
  });

  it('prioritizes tasks correctly', async () => {
    const lowPriorityTask = {
      id: 'task-1',
      agentId: 'agent-1',
      type: 'analysis',
      priority: 3,
      status: 'pending',
    };

    const highPriorityTask = {
      id: 'task-2',
      agentId: 'agent-1',
      type: 'analysis',
      priority: 1,
      status: 'pending',
    };

    await scheduler.scheduleTask(lowPriorityTask);
    await scheduler.scheduleTask(highPriorityTask);

    const tasks = scheduler.getPendingTasks();
    expect(tasks[0].id).toBe('task-2'); // 高优先级任务应该排在前面
  });

  it('handles task execution', async () => {
    const task = {
      id: 'test-task-1',
      agentId: 'agent-1',
      type: 'analysis',
      priority: 1,
      status: 'pending',
    };

    await scheduler.scheduleTask(task);
    await scheduler.executeNext();

    const completedTasks = scheduler.getCompletedTasks();
    expect(completedTasks).toHaveLength(1);
  });
});

describe('AgentExecutor', () => {
  it('executes agent with correct context', async () => {
    const executor = new AgentExecutor();

    const result = await executor.execute({
      agentId: 'test-agent',
      task: 'Analyze market trends',
      context: {
        companyType: 'marketing',
        budget: 1000,
      },
    });

    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
  });

  it('handles execution errors gracefully', async () => {
    const executor = new AgentExecutor();

    const result = await executor.execute({
      agentId: 'invalid-agent',
      task: 'Invalid task',
      context: {},
    });

    expect(result.status).toBe('failed');
    expect(result.error).toBeDefined();
  });
});
