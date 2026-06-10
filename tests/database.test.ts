import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentMindDatabase } from '../src/storage/database';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtempSync, rmSync } from 'fs';

describe('AgentMindDatabase', () => {
  let db: AgentMindDatabase;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'agentmind-test-'));
    db = new AgentMindDatabase(tempDir);
  });

  afterEach(() => {
    db.close();
    rmSync(tempDir, { recursive: true });
  });

  it('should insert and retrieve traces', () => {
    const id = db.insertTrace({
      sessionId: 'test-session',
      agent: 'claude',
      timestamp: Date.now(),
      type: 'prompt',
      content: 'Hello world'
    });

    expect(id).toBeGreaterThan(0);

    const traces = db.getTracesBySession('test-session');
    expect(traces).toHaveLength(1);
    expect(traces[0].content).toBe('Hello world');
  });

  it('should search traces', () => {
    db.insertTrace({
      sessionId: 'session-1',
      agent: 'claude',
      timestamp: Date.now(),
      type: 'prompt',
      content: 'How to handle API errors'
    });

    db.insertTrace({
      sessionId: 'session-2',
      agent: 'codex',
      timestamp: Date.now(),
      type: 'agent_response',
      content: 'Use try-catch blocks for error handling'
    });

    const results = db.searchTraces('error handling');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should manage skills', () => {
    db.insertSkill({
      name: 'error-handling',
      description: 'API error handling patterns',
      content: 'Use retry with exponential backoff',
      sourceSessions: 'session-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0
    });

    const skills = db.getAllSkills();
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe('error-handling');

    const skill = db.getSkillByName('error-handling');
    expect(skill).toBeDefined();
    expect(skill?.content).toBe('Use retry with exponential backoff');
  });

  it('should return statistics', () => {
    db.insertTrace({
      sessionId: 'session-1',
      agent: 'claude',
      timestamp: Date.now(),
      type: 'prompt',
      content: 'Test content'
    });

    const stats = db.getStats();
    expect(stats.totalTraces).toBe(1);
    expect(stats.totalSessions).toBe(1);
    expect(stats.totalSkills).toBe(0);
  });
});
