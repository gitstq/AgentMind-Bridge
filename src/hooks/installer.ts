/**
 * AgentMind-Bridge Hook Installer
 * Installs capture hooks for various AI coding agents
 */

import { join } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from 'fs';

export type AgentType = 'claude' | 'codex' | 'cursor' | 'generic';

export interface HookConfig {
  agent: AgentType;
  hookPath: string;
  configPath?: string;
  backupPath?: string;
}

export class HookInstaller {
  private dataDir: string;

  constructor(customPath?: string) {
    this.dataDir = customPath || join(homedir(), '.agentmind');
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Install hooks for specified agent
   */
  install(agent: AgentType): HookConfig {
    switch (agent) {
      case 'claude':
        return this.installClaudeHook();
      case 'codex':
        return this.installCodexHook();
      case 'cursor':
        return this.installCursorHook();
      case 'generic':
        return this.installGenericHook();
      default:
        throw new Error(`Unsupported agent: ${agent}`);
    }
  }

  /**
   * Uninstall hooks for specified agent
   */
  uninstall(agent: AgentType): void {
    const config = this.getHookConfig(agent);
    
    if (config.backupPath && existsSync(config.backupPath)) {
      // Restore backup
      const originalContent = readFileSync(config.backupPath, 'utf-8');
      writeFileSync(config.hookPath, originalContent);
    } else if (existsSync(config.hookPath)) {
      // Remove hook file
      const { unlinkSync } = require('fs');
      unlinkSync(config.hookPath);
    }
  }

  /**
   * Check if hooks are installed
   */
  isInstalled(agent: AgentType): boolean {
    try {
      const config = this.getHookConfig(agent);
      return existsSync(config.hookPath);
    } catch {
      return false;
    }
  }

  /**
   * Get status of all hooks
   */
  getStatus(): { agent: AgentType; installed: boolean; path?: string }[] {
    const agents: AgentType[] = ['claude', 'codex', 'cursor', 'generic'];
    
    return agents.map(agent => {
      try {
        const config = this.getHookConfig(agent);
        return {
          agent,
          installed: existsSync(config.hookPath),
          path: config.hookPath
        };
      } catch {
        return { agent, installed: false };
      }
    });
  }

  private installClaudeHook(): HookConfig {
    const claudeDir = join(homedir(), '.claude');
    const hookPath = join(claudeDir, 'hooks.json');
    const backupPath = join(this.dataDir, 'backups', 'claude-hooks.json.bak');

    // Ensure directories exist
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
    }
    if (!existsSync(join(this.dataDir, 'backups'))) {
      mkdirSync(join(this.dataDir, 'backups'), { recursive: true });
    }

    // Backup existing hooks
    if (existsSync(hookPath)) {
      const existingContent = readFileSync(hookPath, 'utf-8');
      writeFileSync(backupPath, existingContent);
    }

    // Write Claude hook configuration
    const hookConfig = {
      hooks: {
        sessionStart: {
          command: 'agentmind',
          args: ['session', 'start', '--agent', 'claude', '--session-id', '{{SESSION_ID}}']
        },
        beforeSubmitPrompt: {
          command: 'agentmind',
          args: ['capture', '--session-id', '{{SESSION_ID}}', '--type', 'prompt', '--content', '{{PROMPT}}']
        },
        afterAgentResponse: {
          command: 'agentmind',
          args: ['capture', '--session-id', '{{SESSION_ID}}', '--type', 'agent_response', '--content', '{{RESPONSE}}']
        },
        sessionEnd: {
          command: 'agentmind',
          args: ['session', 'end', '--session-id', '{{SESSION_ID}}']
        }
      }
    };

    writeFileSync(hookPath, JSON.stringify(hookConfig, null, 2));

    return {
      agent: 'claude',
      hookPath,
      backupPath
    };
  }

  private installCodexHook(): HookConfig {
    const codexDir = join(homedir(), '.codex');
    const hookPath = join(codexDir, 'hooks.json');
    const backupPath = join(this.dataDir, 'backups', 'codex-hooks.json.bak');

    if (!existsSync(codexDir)) {
      mkdirSync(codexDir, { recursive: true });
    }
    if (!existsSync(join(this.dataDir, 'backups'))) {
      mkdirSync(join(this.dataDir, 'backups'), { recursive: true });
    }

    if (existsSync(hookPath)) {
      const existingContent = readFileSync(hookPath, 'utf-8');
      writeFileSync(backupPath, existingContent);
    }

    const hookConfig = {
      hooks: {
        sessionStart: {
          command: 'agentmind',
          args: ['session', 'start', '--agent', 'codex', '--session-id', '{{SESSION_ID}}']
        },
        beforeSubmitPrompt: {
          command: 'agentmind',
          args: ['capture', '--session-id', '{{SESSION_ID}}', '--type', 'prompt', '--content', '{{PROMPT}}']
        },
        postToolUse: {
          command: 'agentmind',
          args: ['capture', '--session-id', '{{SESSION_ID}}', '--type', 'tool_call', '--content', '{{TOOL_CALL}}']
        },
        sessionEnd: {
          command: 'agentmind',
          args: ['session', 'end', '--session-id', '{{SESSION_ID}}']
        }
      }
    };

    writeFileSync(hookPath, JSON.stringify(hookConfig, null, 2));

    return {
      agent: 'codex',
      hookPath,
      backupPath
    };
  }

  private installCursorHook(): HookConfig {
    const cursorDir = join(homedir(), '.cursor');
    const hookPath = join(cursorDir, 'hooks.json');
    const backupPath = join(this.dataDir, 'backups', 'cursor-hooks.json.bak');

    if (!existsSync(cursorDir)) {
      mkdirSync(cursorDir, { recursive: true });
    }
    if (!existsSync(join(this.dataDir, 'backups'))) {
      mkdirSync(join(this.dataDir, 'backups'), { recursive: true });
    }

    if (existsSync(hookPath)) {
      const existingContent = readFileSync(hookPath, 'utf-8');
      writeFileSync(backupPath, existingContent);
    }

    const hookConfig = {
      hooks: {
        sessionStart: {
          command: 'agentmind',
          args: ['session', 'start', '--agent', 'cursor', '--session-id', '{{SESSION_ID}}']
        },
        beforeSubmitPrompt: {
          command: 'agentmind',
          args: ['capture', '--session-id', '{{SESSION_ID}}', '--type', 'prompt', '--content', '{{PROMPT}}']
        },
        afterAgentResponse: {
          command: 'agentmind',
          args: ['capture', '--session-id', '{{SESSION_ID}}', '--type', 'agent_response', '--content', '{{RESPONSE}}']
        },
        sessionEnd: {
          command: 'agentmind',
          args: ['session', 'end', '--session-id', '{{SESSION_ID}}']
        }
      }
    };

    writeFileSync(hookPath, JSON.stringify(hookConfig, null, 2));

    return {
      agent: 'cursor',
      hookPath,
      backupPath
    };
  }

  private installGenericHook(): HookConfig {
    const hookPath = join(this.dataDir, 'hooks', 'generic-capture.sh');
    
    if (!existsSync(join(this.dataDir, 'hooks'))) {
      mkdirSync(join(this.dataDir, 'hooks'), { recursive: true });
    }

    const scriptContent = [
      '#!/bin/bash',
      '# AgentMind-Bridge Generic Capture Hook',
      '# Usage: source this script or call functions directly',
      '',
      'AGENTMIND_SESSION_ID=""',
      'AGENTMIND_AGENT="generic"',
      '',
      'agentmind_start_session() {',
      '    AGENTMIND_SESSION_ID="sess_$(date +%s)_$(openssl rand -hex 4)"',
      '    agentmind session start --agent "$AGENTMIND_AGENT" --session-id "$AGENTMIND_SESSION_ID"',
      '    echo "Session started: $AGENTMIND_SESSION_ID"',
      '}',
      '',
      'agentmind_capture() {',
      '    local type="$1"',
      '    local content="$2"',
      '    if [ -z "$AGENTMIND_SESSION_ID" ]; then',
      '        agentmind_start_session',
      '    fi',
      '    agentmind capture --session-id "$AGENTMIND_SESSION_ID" --type "$type" --content "$content"',
      '}',
      '',
      'agentmind_end_session() {',
      '    if [ -n "$AGENTMIND_SESSION_ID" ]; then',
      '        agentmind session end --session-id "$AGENTMIND_SESSION_ID"',
      '        AGENTMIND_SESSION_ID=""',
      '    fi',
      '}',
      '',
      '# Auto-start session if sourced',
      'if [ "${BASH_SOURCE[0]}" != "${0}" ]; then',
      '    agentmind_start_session',
      'fi',
      ''
    ].join('\n');

    writeFileSync(hookPath, scriptContent);
    chmodSync(hookPath, 0o755);

    return {
      agent: 'generic',
      hookPath
    };
  }

  private getHookConfig(agent: AgentType): HookConfig {
    const configs: Record<AgentType, HookConfig> = {
      claude: {
        agent: 'claude',
        hookPath: join(homedir(), '.claude', 'hooks.json'),
        backupPath: join(this.dataDir, 'backups', 'claude-hooks.json.bak')
      },
      codex: {
        agent: 'codex',
        hookPath: join(homedir(), '.codex', 'hooks.json'),
        backupPath: join(this.dataDir, 'backups', 'codex-hooks.json.bak')
      },
      cursor: {
        agent: 'cursor',
        hookPath: join(homedir(), '.cursor', 'hooks.json'),
        backupPath: join(this.dataDir, 'backups', 'cursor-hooks.json.bak')
      },
      generic: {
        agent: 'generic',
        hookPath: join(this.dataDir, 'hooks', 'generic-capture.sh')
      }
    };

    return configs[agent];
  }
}
