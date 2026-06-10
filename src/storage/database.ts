/**
 * AgentMind-Bridge Database Layer
 * Lightweight SQLite storage for session traces, skills, and embeddings
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';

export interface SessionTrace {
  id?: number;
  sessionId: string;
  agent: string;
  timestamp: number;
  type: 'prompt' | 'tool_call' | 'tool_response' | 'agent_response';
  content: string;
  metadata?: string;
}

export interface Skill {
  id?: number;
  name: string;
  description: string;
  content: string;
  sourceSessions: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
}

export class AgentMindDatabase {
  private db: Database.Database;
  private dataDir: string;

  constructor(customPath?: string) {
    this.dataDir = customPath || join(homedir(), '.agentmind');
    const dbPath = join(this.dataDir, 'memory.db');
    
    // Ensure data directory exists
    const fs = require('fs');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  private initializeTables(): void {
    // Session traces table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_traces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        agent TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_session_id ON session_traces(session_id);
      CREATE INDEX IF NOT EXISTS idx_agent ON session_traces(agent);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON session_traces(timestamp);
      CREATE INDEX IF NOT EXISTS idx_type ON session_traces(type);
    `);

    // Skills table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        content TEXT NOT NULL,
        source_sessions TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        usage_count INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_skill_name ON skills(name);
    `);

    // FTS5 virtual table for full-text search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS trace_search USING fts5(
        content,
        session_id,
        agent,
        type,
        content='session_traces',
        content_rowid='id'
      );
    `);

    // Triggers to keep FTS index in sync
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS trace_search_insert AFTER INSERT ON session_traces BEGIN
        INSERT INTO trace_search(rowid, content, session_id, agent, type)
        VALUES (new.id, new.content, new.session_id, new.agent, new.type);
      END;
      
      CREATE TRIGGER IF NOT EXISTS trace_search_delete AFTER DELETE ON session_traces BEGIN
        INSERT INTO trace_search(trace_search, rowid, content, session_id, agent, type)
        VALUES ('delete', old.id, old.content, old.session_id, old.agent, old.type);
      END;
    `);
  }

  // Session Trace Operations
  insertTrace(trace: SessionTrace): number {
    const stmt = this.db.prepare(`
      INSERT INTO session_traces (session_id, agent, timestamp, type, content, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      trace.sessionId,
      trace.agent,
      trace.timestamp,
      trace.type,
      trace.content,
      trace.metadata || null
    );
    return result.lastInsertRowid as number;
  }

  getTracesBySession(sessionId: string): SessionTrace[] {
    const stmt = this.db.prepare(`
      SELECT * FROM session_traces WHERE session_id = ? ORDER BY timestamp ASC
    `);
    return stmt.all(sessionId) as SessionTrace[];
  }

  getTracesByAgent(agent: string, limit: number = 100): SessionTrace[] {
    const stmt = this.db.prepare(`
      SELECT * FROM session_traces WHERE agent = ? ORDER BY timestamp DESC LIMIT ?
    `);
    return stmt.all(agent, limit) as SessionTrace[];
  }

  searchTraces(query: string, limit: number = 20): SessionTrace[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM session_traces t
      JOIN trace_search s ON t.id = s.rowid
      WHERE trace_search MATCH ?
      ORDER BY rank
      LIMIT ?
    `);
    return stmt.all(query, limit) as SessionTrace[];
  }

  // Skill Operations
  insertSkill(skill: Omit<Skill, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO skills (name, description, content, source_sessions, created_at, updated_at, usage_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        description = excluded.description,
        content = excluded.content,
        source_sessions = excluded.source_sessions,
        updated_at = excluded.updated_at,
        usage_count = skills.usage_count + 1
    `);
    const result = stmt.run(
      skill.name,
      skill.description,
      skill.content,
      skill.sourceSessions,
      skill.createdAt,
      skill.updatedAt,
      skill.usageCount
    );
    return result.lastInsertRowid as number;
  }

  getAllSkills(): Skill[] {
    const stmt = this.db.prepare(`SELECT * FROM skills ORDER BY usage_count DESC`);
    return stmt.all() as Skill[];
  }

  getSkillByName(name: string): Skill | undefined {
    const stmt = this.db.prepare(`SELECT * FROM skills WHERE name = ?`);
    return stmt.get(name) as Skill | undefined;
  }

  searchSkills(query: string): Skill[] {
    const stmt = this.db.prepare(`
      SELECT * FROM skills 
      WHERE name LIKE ? OR description LIKE ? OR content LIKE ?
      ORDER BY usage_count DESC
    `);
    const pattern = `%${query}%`;
    return stmt.all(pattern, pattern, pattern) as Skill[];
  }

  incrementSkillUsage(name: string): void {
    const stmt = this.db.prepare(`
      UPDATE skills SET usage_count = usage_count + 1, updated_at = ? WHERE name = ?
    `);
    stmt.run(Date.now(), name);
  }

  // Statistics
  getStats(): { totalTraces: number; totalSkills: number; totalSessions: number } {
    const tracesCount = this.db.prepare('SELECT COUNT(*) as count FROM session_traces').get() as { count: number };
    const skillsCount = this.db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number };
    const sessionsCount = this.db.prepare('SELECT COUNT(DISTINCT session_id) as count FROM session_traces').get() as { count: number };
    
    return {
      totalTraces: tracesCount.count,
      totalSkills: skillsCount.count,
      totalSessions: sessionsCount.count
    };
  }

  // Cleanup
  close(): void {
    this.db.close();
  }

  vacuum(): void {
    this.db.exec('VACUUM');
  }
}
