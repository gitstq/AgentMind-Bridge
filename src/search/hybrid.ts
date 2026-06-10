/**
 * AgentMind-Bridge Hybrid Search Engine
 * Combines full-text search (FTS5) with keyword matching for optimal recall
 */

import { AgentMindDatabase, SessionTrace } from '../storage/database';

export interface SearchResult {
  trace: SessionTrace;
  score: number;
  matchType: 'fts' | 'keyword' | 'hybrid';
}

export interface SearchOptions {
  limit?: number;
  agents?: string[];
  types?: string[];
  dateRange?: { start: number; end: number };
  hybridWeight?: number; // 0-1, weight for FTS vs keyword
}

export class HybridSearchEngine {
  private db: AgentMindDatabase;

  constructor(db: AgentMindDatabase) {
    this.db = db;
  }

  /**
   * Perform hybrid search combining FTS and keyword matching
   */
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const {
      limit = 20,
      agents,
      types,
      dateRange,
      hybridWeight = 0.6
    } = options;

    // Get FTS results
    const ftsResults = this.searchFTS(query, limit * 2);
    
    // Get keyword results
    const keywordResults = this.searchKeyword(query, limit * 2);
    
    // Merge and score results
    const mergedResults = this.mergeResults(
      ftsResults, 
      keywordResults, 
      hybridWeight,
      limit
    );

    // Apply filters
    return this.applyFilters(mergedResults, { agents, types, dateRange });
  }

  /**
   * Search for skills
   */
  searchSkills(query: string, limit: number = 10): any[] {
    return this.db.searchSkills(query).slice(0, limit);
  }

  /**
   * Get recent traces with context
   */
  getRecentWithContext(agent?: string, limit: number = 10): SessionTrace[] {
    if (agent) {
      return this.db.getTracesByAgent(agent, limit);
    }
    
    // Get all recent traces
    const stats = this.db.getStats();
    // Simplified: return search with broad query
    return this.db.searchTraces('*', limit);
  }

  private searchFTS(query: string, limit: number): Map<number, SearchResult> {
    const results = new Map<number, SearchResult>();
    
    try {
      const traces = this.db.searchTraces(query, limit);
      
      traces.forEach((trace, index) => {
        const score = 1.0 - (index * 0.05); // Rank-based scoring
        results.set(trace.id!, {
          trace,
          score: Math.max(score, 0.5),
          matchType: 'fts'
        });
      });
    } catch (error) {
      // FTS might fail for complex queries, fallback to keyword
      console.warn('FTS search failed, using keyword fallback:', error);
    }

    return results;
  }

  private searchKeyword(query: string, limit: number): Map<number, SearchResult> {
    const results = new Map<number, SearchResult>();
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    
    if (keywords.length === 0) {
      return results;
    }

    // Get recent traces and score by keyword matches
    const traces = this.db.searchTraces('*', limit * 3);
    
    traces.forEach(trace => {
      const content = trace.content.toLowerCase();
      let matchCount = 0;
      
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          matchCount++;
        }
      });
      
      if (matchCount > 0) {
        const score = matchCount / keywords.length;
        results.set(trace.id!, {
          trace,
          score: Math.min(score, 1.0),
          matchType: 'keyword'
        });
      }
    });

    return results;
  }

  private mergeResults(
    ftsResults: Map<number, SearchResult>,
    keywordResults: Map<number, SearchResult>,
    hybridWeight: number,
    limit: number
  ): SearchResult[] {
    const merged = new Map<number, SearchResult>();

    // Add FTS results with weight
    ftsResults.forEach((result, id) => {
      merged.set(id, {
        ...result,
        score: result.score * hybridWeight
      });
    });

    // Merge keyword results
    keywordResults.forEach((result, id) => {
      const existing = merged.get(id);
      if (existing) {
        // Hybrid match - boost score
        existing.score = Math.min(
          existing.score + result.score * (1 - hybridWeight) + 0.1,
          1.0
        );
        existing.matchType = 'hybrid';
      } else {
        merged.set(id, {
          ...result,
          score: result.score * (1 - hybridWeight)
        });
      }
    });

    // Sort by score and limit
    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private applyFilters(
    results: SearchResult[],
    filters: { agents?: string[]; types?: string[]; dateRange?: { start: number; end: number } }
  ): SearchResult[] {
    return results.filter(result => {
      const { trace } = result;

      if (filters.agents && !filters.agents.includes(trace.agent)) {
        return false;
      }

      if (filters.types && !filters.types.includes(trace.type)) {
        return false;
      }

      if (filters.dateRange) {
        if (trace.timestamp < filters.dateRange.start || 
            trace.timestamp > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }
}
