#!/usr/bin/env node
/**
 * AgentMind-Bridge CLI
 * Command-line interface for managing shared agent memory
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { AgentMindDatabase } from '../storage/database';
import { SessionManager } from '../core/session';
import { HybridSearchEngine } from '../search/hybrid';
import { SkillMiner } from '../skills/miner';
import { HookInstaller } from '../hooks/installer';

const program = new Command();
const pkg = require('../../package.json');

program
  .name('agentmind')
  .description('AgentMind-Bridge - Lightweight shared memory for AI agents')
  .version(pkg.version);

// Initialize database connection (lazy)
let dbInstance: AgentMindDatabase | null = null;
function getDb(): AgentMindDatabase {
  if (!dbInstance) {
    dbInstance = new AgentMindDatabase();
  }
  return dbInstance;
}

// ==================== SESSION COMMANDS ====================

program
  .command('session')
  .description('Session management commands')
  .addCommand(
    new Command('start')
      .description('Start a new session')
      .requiredOption('-a, --agent <agent>', 'Agent name (claude, codex, cursor)')
      .requiredOption('-s, --session-id <id>', 'Session identifier')
      .action((options) => {
        const db = getDb();
        const sessionManager = new SessionManager(db);
        
        try {
          const sessionId = sessionManager.startSession({
            agent: options.agent,
            sessionId: options.sessionId
          });
          
          console.log(chalk.green('✓ Session started'));
          console.log(chalk.gray(`  Agent: ${options.agent}`));
          console.log(chalk.gray(`  Session: ${sessionId}`));
        } catch (error) {
          console.error(chalk.red('✗ Failed to start session:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('end')
      .description('End a session')
      .requiredOption('-s, --session-id <id>', 'Session identifier')
      .action((options) => {
        const db = getDb();
        const sessionManager = new SessionManager(db);
        
        try {
          sessionManager.endSession(options.sessionId);
          console.log(chalk.green('✓ Session ended'));
          console.log(chalk.gray(`  Session: ${options.sessionId}`));
        } catch (error) {
          console.error(chalk.red('✗ Failed to end session:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List active sessions')
      .action(() => {
        const db = getDb();
        const sessionManager = new SessionManager(db);
        const sessions = sessionManager.getActiveSessions();
        
        if (sessions.length === 0) {
          console.log(chalk.yellow('No active sessions'));
          return;
        }
        
        console.log(chalk.blue(`Active Sessions (${sessions.length}):`));
        sessions.forEach(session => {
          console.log(chalk.gray(`  • ${session.sessionId} (${session.agent})`));
        });
      })
  );

// ==================== CAPTURE COMMANDS ====================

program
  .command('capture')
  .description('Capture a trace event')
  .requiredOption('-s, --session-id <id>', 'Session identifier')
  .requiredOption('-t, --type <type>', 'Event type (prompt, tool_call, tool_response, agent_response)')
  .requiredOption('-c, --content <content>', 'Event content')
  .option('-m, --metadata <json>', 'JSON metadata')
  .action((options) => {
    const db = getDb();
    const sessionManager = new SessionManager(db);
    
    try {
      const metadata = options.metadata ? JSON.parse(options.metadata) : undefined;
      
      const id = sessionManager.capture(options.sessionId, {
        type: options.type,
        content: options.content,
        metadata
      });
      
      console.log(chalk.green('✓ Event captured'));
      console.log(chalk.gray(`  ID: ${id}`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to capture event:'), error);
      process.exit(1);
    }
  });

// ==================== SEARCH COMMANDS ====================

program
  .command('search')
  .description('Search memory traces')
  .argument('<query>', 'Search query')
  .option('-l, --limit <n>', 'Result limit', '10')
  .option('-a, --agent <agent>', 'Filter by agent')
  .action((query, options) => {
    const db = getDb();
    const searchEngine = new HybridSearchEngine(db);
    
    try {
      const searchOptions: any = {
        limit: parseInt(options.limit)
      };
      
      if (options.agent) {
        searchOptions.agents = [options.agent];
      }
      
      const results = searchEngine.search(query, searchOptions);
      
      if (results.length === 0) {
        console.log(chalk.yellow('No results found'));
        return;
      }
      
      console.log(chalk.blue(`Search Results (${results.length}):`));
      results.forEach((result, index) => {
        const trace = result.trace;
        const score = (result.score * 100).toFixed(1);
        const matchType = result.matchType.toUpperCase();
        
        console.log(chalk.gray(`\n[${index + 1}] Score: ${score}% (${matchType})`));
        console.log(chalk.gray(`    Agent: ${trace.agent} | Type: ${trace.type}`));
        console.log(chalk.white(`    ${trace.content.substring(0, 200)}${trace.content.length > 200 ? '...' : ''}`));
      });
    } catch (error) {
      console.error(chalk.red('✗ Search failed:'), error);
      process.exit(1);
    }
  });

// ==================== SKILL COMMANDS ====================

program
  .command('skills')
  .description('Skill management commands')
  .addCommand(
    new Command('mine')
      .description('Mine skills from sessions')
      .option('-s, --session <id>', 'Mine from specific session')
      .action((options) => {
        const db = getDb();
        const miner = new SkillMiner(db);
        
        try {
          let skills;
          if (options.session) {
            skills = miner.mineFromSession(options.session);
          } else {
            skills = miner.mineAllSessions();
          }
          
          if (skills.length === 0) {
            console.log(chalk.yellow('No new skills found'));
            return;
          }
          
          console.log(chalk.green(`✓ Mined ${skills.length} skills:`));
          skills.forEach(skill => {
            console.log(chalk.gray(`  • ${skill.name}: ${skill.description}`));
          });
        } catch (error) {
          console.error(chalk.red('✗ Skill mining failed:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List all skills')
      .action(() => {
        const db = getDb();
        const skills = db.getAllSkills();
        
        if (skills.length === 0) {
          console.log(chalk.yellow('No skills found. Run `agentmind skills mine` first.'));
          return;
        }
        
        console.log(chalk.blue(`Skills (${skills.length}):`));
        skills.forEach(skill => {
          console.log(chalk.gray(`  • ${skill.name} (used ${skill.usageCount}x)`));
          console.log(chalk.gray(`    ${skill.description}`));
        });
      })
  )
  .addCommand(
    new Command('show')
      .description('Show skill details')
      .argument('<name>', 'Skill name')
      .action((name) => {
        const db = getDb();
        const skill = db.getSkillByName(name);
        
        if (!skill) {
          console.log(chalk.yellow(`Skill '${name}' not found`));
          return;
        }
        
        console.log(chalk.blue(`Skill: ${skill.name}`));
        console.log(chalk.gray(`Description: ${skill.description}`));
        console.log(chalk.gray(`Usage: ${skill.usageCount} times`));
        console.log(chalk.gray(`Source: ${skill.sourceSessions}`));
        console.log(chalk.white('\nContent:'));
        console.log(skill.content);
      })
  );

// ==================== HOOK COMMANDS ====================

program
  .command('hooks')
  .description('Hook installation management')
  .addCommand(
    new Command('install')
      .description('Install hooks for an agent')
      .argument('<agent>', 'Agent type (claude, codex, cursor, generic)')
      .action((agent) => {
        const installer = new HookInstaller();
        
        try {
          const config = installer.install(agent as any);
          console.log(chalk.green(`✓ Hooks installed for ${agent}`));
          console.log(chalk.gray(`  Path: ${config.hookPath}`));
          if (config.backupPath) {
            console.log(chalk.gray(`  Backup: ${config.backupPath}`));
          }
        } catch (error) {
          console.error(chalk.red('✗ Installation failed:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('uninstall')
      .description('Uninstall hooks for an agent')
      .argument('<agent>', 'Agent type (claude, codex, cursor, generic)')
      .action((agent) => {
        const installer = new HookInstaller();
        
        try {
          installer.uninstall(agent as any);
          console.log(chalk.green(`✓ Hooks uninstalled for ${agent}`));
        } catch (error) {
          console.error(chalk.red('✗ Uninstall failed:'), error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Check hook installation status')
      .action(() => {
        const installer = new HookInstaller();
        const status = installer.getStatus();
        
        console.log(chalk.blue('Hook Status:'));
        status.forEach(s => {
          const icon = s.installed ? chalk.green('✓') : chalk.red('✗');
          const path = s.path ? chalk.gray(` (${s.path})`) : '';
          console.log(`  ${icon} ${s.agent}${path}`);
        });
      })
  );

// ==================== STATS COMMAND ====================

program
  .command('stats')
  .description('Show memory statistics')
  .action(() => {
    const db = getDb();
    const stats = db.getStats();
    
    console.log(chalk.blue('AgentMind-Bridge Statistics'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.white(`Total Sessions: ${stats.totalSessions}`));
    console.log(chalk.white(`Total Traces:   ${stats.totalTraces}`));
    console.log(chalk.white(`Total Skills:   ${stats.totalSkills}`));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.gray('Data stored locally in ~/.agentmind/'));
  });

// ==================== CONTEXT COMMAND ====================

program
  .command('context')
  .description('Build context for a session')
  .requiredOption('-s, --session-id <id>', 'Session identifier')
  .requiredOption('-q, --query <query>', 'Context query')
  .option('-t, --max-tokens <n>', 'Maximum tokens', '4000')
  .action((options) => {
    const db = getDb();
    const sessionManager = new SessionManager(db);
    
    try {
      const context = sessionManager.buildContext(
        options.sessionId,
        options.query,
        parseInt(options.maxTokens)
      );
      
      console.log(chalk.blue('Generated Context:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(context);
    } catch (error) {
      console.error(chalk.red('✗ Context building failed:'), error);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
