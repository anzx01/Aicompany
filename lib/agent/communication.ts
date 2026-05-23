// Agent Communication - Message passing between agents

import { EventEmitter } from 'events'
import type { AgentMessage } from './types'

export class AgentCommunicationBus extends EventEmitter {
  private static instance: AgentCommunicationBus

  private constructor() {
    super()
    this.setMaxListeners(100) // Allow many agents
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AgentCommunicationBus {
    if (!AgentCommunicationBus.instance) {
      AgentCommunicationBus.instance = new AgentCommunicationBus()
    }
    return AgentCommunicationBus.instance
  }

  /**
   * Send a message from one agent to another
   */
  sendMessage(message: AgentMessage): void {
    console.log(`[CommBus] ${message.from} -> ${message.to}: ${message.type}`)

    // Emit to specific agent
    this.emit(`agent:${message.to}`, message)

    // Also emit to broadcast channel for monitoring
    this.emit('message', message)
  }

  /**
   * Broadcast a message to all agents
   */
  broadcast(message: Omit<AgentMessage, 'to'>): void {
    console.log(`[CommBus] Broadcast from ${message.from}: ${message.type}`)

    this.emit('broadcast', { ...message, to: '*' })
  }

  /**
   * Subscribe to messages for a specific agent
   */
  subscribeAgent(agentId: string, handler: (message: AgentMessage) => void): () => void {
    const eventName = `agent:${agentId}`
    this.on(eventName, handler)

    // Return unsubscribe function
    return () => {
      this.off(eventName, handler)
    }
  }

  /**
   * Subscribe to all messages (for monitoring)
   */
  subscribeAll(handler: (message: AgentMessage) => void): () => void {
    this.on('message', handler)

    return () => {
      this.off('message', handler)
    }
  }

  /**
   * Subscribe to broadcasts
   */
  subscribeBroadcast(handler: (message: AgentMessage) => void): () => void {
    this.on('broadcast', handler)

    return () => {
      this.off('broadcast', handler)
    }
  }

  /**
   * Request-response pattern
   */
  async request(
    from: string,
    to: string,
    type: AgentMessage['type'],
    payload: any,
    timeout: number = 30000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `${from}-${to}-${Date.now()}`

      // Set up response handler
      const responseHandler = (message: AgentMessage) => {
        if (
          message.from === to &&
          message.to === from &&
          (message.payload as any).requestId === requestId
        ) {
          clearTimeout(timeoutId)
          this.off(`agent:${from}`, responseHandler)
          resolve(message.payload)
        }
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.off(`agent:${from}`, responseHandler)
        reject(new Error(`Request timeout: ${from} -> ${to}`))
      }, timeout)

      // Subscribe to responses
      this.on(`agent:${from}`, responseHandler)

      // Send request
      this.sendMessage({
        from,
        to,
        type,
        payload: {
          ...payload,
          requestId,
        },
        timestamp: new Date(),
      })
    })
  }

  /**
   * Send a response to a request
   */
  respond(originalMessage: AgentMessage, responsePayload: any): void {
    this.sendMessage({
      from: originalMessage.to,
      to: originalMessage.from,
      type: 'TASK_RESULT',
      payload: {
        ...responsePayload,
        requestId: (originalMessage.payload as any).requestId,
      },
      timestamp: new Date(),
    })
  }
}

// Export singleton instance
export const commBus = AgentCommunicationBus.getInstance()

/**
 * Helper: Send task request to another agent
 */
export async function delegateTask(
  fromAgentId: string,
  toAgentId: string,
  taskData: any
): Promise<any> {
  return await commBus.request(fromAgentId, toAgentId, 'TASK_REQUEST', taskData)
}

/**
 * Helper: Notify agent of an event
 */
export function notifyAgent(
  fromAgentId: string,
  toAgentId: string,
  notification: any
): void {
  commBus.sendMessage({
    from: fromAgentId,
    to: toAgentId,
    type: 'NOTIFICATION',
    payload: notification,
    timestamp: new Date(),
  })
}

/**
 * Helper: Ask user a question
 */
export async function askUser(
  agentId: string,
  question: string,
  options?: string[]
): Promise<string> {
  // In a real implementation, this would integrate with the UI
  // For now, we'll just return a placeholder
  console.log(`[Agent ${agentId}] Question: ${question}`)
  if (options) {
    console.log(`Options: ${options.join(', ')}`)
  }

  return 'User response placeholder'
}
