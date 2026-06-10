import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../src/core/session';
import { AgentMindDatabase } from '../src/storage/database';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtempSync, rmSync } from 'fs';

describe('SessionManager', () => {
  let db: AgentMindDatabase;
  let sessionManager: SessionManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'agentmind-session-test-'));
    db = new AgentMindDatabase(tempDir);
    sessionManager = new SessionManager(db);
  });

  afterEach(() => {
    db.close();
    rmSync(tempDir, { recursive: true });
  });

  it('should start and end sessions', () => {
    const sessionId = sessionManager.startSession({
      agent: 'claude',
      sessionId: 'test-session'
    });

    expect(sessionId).toBe('test-session');
    expect(sessionManager.isActive(sessionId)).toBe(true);

    sessionManager.endSession(sessionId);
    expect(sessionManager.isActive(sessionId)).toBe(false);
  });

  it('should capture events', () => {
    const sessionId = sessionManager.startSession({
      agent: 'claude',
      sessionId: 'capture-test'
    });

    const id = sessionManager.capture(sessionId, {
      type: 'prompt',
      content: 'How do I refactor this code?'
    });

    expect(id).toBeGreaterThan(0);

    const history = sessionManager.getSessionHistory(sessionId);
    expect(history).toHaveLength(1);
    expect(history[0].content).toBe('How do I refactor this code?');
  });

  it('should throw for inactive sessions', () => {
    expect(() => {
      sessionManager.capture('non-existent', {
        type: 'prompt',
        content: 'test'
      });
    }).toThrow('Session non-existent not found');
  });

  it('should build context', () => {
    const sessionId = sessionManager.startSession({
      agent: 'claude',
      sessionId: 'context-test'
    });

    sessionManager.capture(sessionId, {
      type: 'prompt',
      content: 'How to handle errors in async functions?'
    });

    sessionManager.capture(sessionId, {
      type: 'agent_response',
      content: 'Use try-catch with await'
    });

    const context = sessionManager.buildContext(sessionId, 'error handling');
    expect(context).toContain('error');
    expect(context).toContain('try-catch');
  });
});
