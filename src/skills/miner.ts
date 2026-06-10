/**
 * AgentMind-Bridge Skill Miner
 * Extracts reusable skills from session traces using pattern detection
 */

import { AgentMindDatabase, Skill } from '../storage/database';

export interface SkillPattern {
  name: string;
  description: string;
  indicators: string[];
  extractor: (traces: any[]) => string | null;
}

export class SkillMiner {
  private db: AgentMindDatabase;
  
  // Predefined skill patterns
  private patterns: SkillPattern[] = [
    {
      name: 'api-error-handling',
      description: 'Patterns for handling API errors and retries',
      indicators: ['error', 'retry', 'status code', 'timeout', 'rate limit'],
      extractor: this.extractErrorHandlingPattern
    },
    {
      name: 'database-migration',
      description: 'Database schema migration patterns',
      indicators: ['migration', 'schema', 'table', 'column', 'index'],
      extractor: this.extractMigrationPattern
    },
    {
      name: 'auth-pattern',
      description: 'Authentication and authorization patterns',
      indicators: ['auth', 'token', 'jwt', 'login', 'permission', 'role'],
      extractor: this.extractAuthPattern
    },
    {
      name: 'testing-strategy',
      description: 'Testing patterns and strategies',
      indicators: ['test', 'mock', 'stub', 'assert', 'coverage', 'jest', 'vitest'],
      extractor: this.extractTestingPattern
    },
    {
      name: 'deployment-flow',
      description: 'Deployment and CI/CD patterns',
      indicators: ['deploy', 'docker', 'kubernetes', 'ci/cd', 'pipeline', 'build'],
      extractor: this.extractDeploymentPattern
    }
  ];

  constructor(db: AgentMindDatabase) {
    this.db = db;
  }

  /**
   * Mine skills from a session
   */
  mineFromSession(sessionId: string): Skill[] {
    const traces = this.db.getTracesBySession(sessionId);
    const minedSkills: Skill[] = [];

    for (const pattern of this.patterns) {
      const matchedTraces = this.matchPattern(traces, pattern);
      
      if (matchedTraces.length >= 3) { // Minimum threshold
        const content = pattern.extractor(matchedTraces);
        
        if (content) {
          const skill: Omit<Skill, 'id'> = {
            name: pattern.name,
            description: pattern.description,
            content,
            sourceSessions: sessionId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0
          };

          this.db.insertSkill(skill);
          minedSkills.push(skill as Skill);
        }
      }
    }

    return minedSkills;
  }

  /**
   * Mine skills from all sessions
   */
  mineAllSessions(): Skill[] {
    const stats = this.db.getStats();
    const allSkills: Skill[] = [];
    
    // This is a simplified version - in production, you'd query distinct session IDs
    // For now, we'll mine from recent traces
    const recentTraces = this.db.searchTraces('*', 1000);
    const sessionIds = [...new Set(recentTraces.map(t => t.sessionId))];

    for (const sessionId of sessionIds) {
      const skills = this.mineFromSession(sessionId);
      allSkills.push(...skills);
    }

    return allSkills;
  }

  /**
   * Add a custom pattern
   */
  addPattern(pattern: SkillPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Get all patterns
   */
  getPatterns(): SkillPattern[] {
    return [...this.patterns];
  }

  private matchPattern(traces: any[], pattern: SkillPattern): any[] {
    return traces.filter(trace => {
      const content = trace.content.toLowerCase();
      return pattern.indicators.some(indicator => 
        content.includes(indicator.toLowerCase())
      );
    });
  }

  // Pattern extractors
  private extractErrorHandlingPattern(traces: any[]): string | null {
    const relevantContent = traces
      .filter(t => t.type === 'agent_response' || t.type === 'tool_response')
      .map(t => t.content)
      .join('\n---\n');
    
    return relevantContent.length > 100 ? relevantContent : null;
  }

  private extractMigrationPattern(traces: any[]): string | null {
    const relevantContent = traces
      .filter(t => t.content.toLowerCase().includes('migration') || 
                   t.content.toLowerCase().includes('schema'))
      .map(t => t.content)
      .join('\n---\n');
    
    return relevantContent.length > 100 ? relevantContent : null;
  }

  private extractAuthPattern(traces: any[]): string | null {
    const relevantContent = traces
      .filter(t => t.type === 'agent_response')
      .map(t => t.content)
      .join('\n---\n');
    
    return relevantContent.length > 100 ? relevantContent : null;
  }

  private extractTestingPattern(traces: any[]): string | null {
    const relevantContent = traces
      .filter(t => t.content.toLowerCase().includes('test') || 
                   t.content.toLowerCase().includes('mock'))
      .map(t => t.content)
      .join('\n---\n');
    
    return relevantContent.length > 100 ? relevantContent : null;
  }

  private extractDeploymentPattern(traces: any[]): string | null {
    const relevantContent = traces
      .filter(t => t.type === 'agent_response' || t.type === 'tool_call')
      .map(t => t.content)
      .join('\n---\n');
    
    return relevantContent.length > 100 ? relevantContent : null;
  }
}
