/**
 * AgentMind-Bridge Session Manager
 * Handles session lifecycle, trace capture, and context building
 */

import { AgentMindDatabase, SessionTrace } from '../storage/database';
import { EventEmitter } from 'events';

export interface SessionConfig {
  agent: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface CaptureEvent {
  type: 'prompt' | 'tool_call' | 'tool_response' | 'agent_response';
  content: string;
  metadata?: Record<string, any>;
}

export class SessionManager extends EventEmitter {
  private db: AgentMindDatabase;
  private activeSessions: Map<string, SessionConfig> = new Map();

  constructor(db: AgentMindDatabase) {
    super();
    this.db = db;
  }

  /**
   * Start a new session
   */
  startSession(config: SessionConfig): string {
    const sessionId = config.sessionId || this.generateSessionId();
    const sessionConfig: SessionConfig = {
      ...config,
      sessionId
    };
    
    this.activeSessions.set(sessionId, sessionConfig);
    this.emit('session:start', sessionConfig);
    
    return sessionId;
  }

  /**
   * Capture an event in the session
   */
  capture(sessionId: string, event: CaptureEvent): number {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found. Start a session first.`);
    }

    const trace: SessionTrace = {
      sessionId,
      agent: session.agent,
      timestamp: Date.now(),
      type: event.type,
      content: event.content,
      metadata: event.metadata ? JSON.stringify(event.metadata) : undefined
    };

    const id = this.db.insertTrace(trace);
    this.emit('trace:capture', { id, ...trace });
    
    return id;
  }

  /**
   * End a session
   */
  endSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.activeSessions.delete(sessionId);
    this.emit('session:end', session);
  }

  /**
   * Get session history
   */
  getSessionHistory(sessionId: string): SessionTrace[] {
    return this.db.getTracesBySession(sessionId);
  }

  /**
   * Build context for agent recall
   */
  buildContext(sessionId: string, query: string, maxTokens: number = 4000): string {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Get current session history
    const currentHistory = this.getSessionHistory(sessionId);
    
    // Search for relevant traces from other sessions
    const relevantTraces = this.db.searchTraces(query, 10);
    
    // Filter out current session traces and deduplicate
    const otherSessionTraces = relevantTraces.filter(t => t.sessionId !== sessionId);
    
    // Build context string
    let context = '';
    let tokenCount = 0;
    const approxTokensPerChar = 0.25;

    // Add relevant historical context first
    for (const trace of otherSessionTraces) {
      const entry = `[${trace.agent}] ${trace.type}: ${trace.content}\n`;
      const entryTokens = entry.length * approxTokensPerChar;
      
      if (tokenCount + entryTokens > maxTokens * 0.7) break;
      
      context += entry;
      tokenCount += entryTokens;
    }

    // Add current session context
    if (currentHistory.length > 0) {
      context += '\n--- Current Session ---\n';
      for (const trace of currentHistory.slice(-10)) {
        const entry = `${trace.type}: ${trace.content}\n`;
        const entryTokens = entry.length * approxTokensPerChar;
        
        if (tokenCount + entryTokens > maxTokens) break;
        
        context += entry;
        tokenCount += entryTokens;
      }
    }

    return context;
  }

  /**
   * List active sessions
   */
  getActiveSessions(): SessionConfig[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Check if session is active
   */
  isActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${random}`;
  }
}
