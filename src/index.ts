/**
 * AgentMind-Bridge
 * Main entry point for programmatic API usage
 */

export { AgentMindDatabase, SessionTrace, Skill } from './storage/database';
export { SessionManager, SessionConfig, CaptureEvent } from './core/session';
export { HybridSearchEngine, SearchResult, SearchOptions } from './search/hybrid';
export { SkillMiner, SkillPattern } from './skills/miner';
export { HookInstaller, AgentType, HookConfig } from './hooks/installer';

import { AgentMindDatabase } from './storage/database';
import { SessionManager } from './core/session';
import { HybridSearchEngine } from './search/hybrid';
import { SkillMiner } from './skills/miner';
import { HookInstaller } from './hooks/installer';

/**
 * Main AgentMind-Bridge class for easy integration
 */
export class AgentMindBridge {
  public db: AgentMindDatabase;
  public sessions: SessionManager;
  public search: HybridSearchEngine;
  public skills: SkillMiner;
  public hooks: HookInstaller;

  constructor(dataPath?: string) {
    this.db = new AgentMindDatabase(dataPath);
    this.sessions = new SessionManager(this.db);
    this.search = new HybridSearchEngine(this.db);
    this.skills = new SkillMiner(this.db);
    this.hooks = new HookInstaller(dataPath);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

export default AgentMindBridge;
