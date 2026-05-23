import { router } from '../trpc';
import { companyRouter } from './company';
import { agentRouter } from './agent';
import { taskRouter } from './task';
import { llmRouter } from './llm';
import { platformRouter } from './platform';
import { memoryRouter } from './memory';
import { heartbeatRouter } from './heartbeat';
import { openclawRouter } from './openclaw';

export const appRouter = router({
  company: companyRouter,
  agent: agentRouter,
  task: taskRouter,
  llm: llmRouter,
  platform: platformRouter,
  memory: memoryRouter,
  heartbeat: heartbeatRouter,
  openclaw: openclawRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
