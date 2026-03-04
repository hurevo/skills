import { join } from 'path'
import { homedir } from 'os'

/**
 * Agent install path definitions.
 * project: relative to cwd
 * global: absolute path in user home config
 */
export const AGENTS = {
  opencode: {
    name: 'OpenCode',
    projectPath: (skillName) => join('.opencode', 'skills', skillName),
    globalPath: (skillName) => join(homedir(), '.config', 'opencode', 'skills', skillName),
  },
  claude: {
    name: 'Claude Code',
    projectPath: (skillName) => join('.claude', 'skills', skillName),
    globalPath: null,
  },
  cursor: {
    name: 'Cursor',
    projectPath: (skillName) => join('.cursor', 'skills', skillName),
    globalPath: null,
  },
  windsurf: {
    name: 'Windsurf',
    projectPath: (skillName) => join('.windsurf', 'skills', skillName),
    globalPath: null,
  },
}

export const AGENT_NAMES = Object.keys(AGENTS)

/**
 * Resolve which agents to target based on the --agent option.
 * @param {string} agent - agent name or 'all'
 * @returns {string[]} list of agent keys
 */
export function resolveAgents(agent) {
  if (agent === 'all') return AGENT_NAMES
  if (!AGENTS[agent]) {
    throw new Error(`Unknown agent "${agent}". Valid options: ${AGENT_NAMES.join(', ')}, all`)
  }
  return [agent]
}

/**
 * Resolve the install path for a skill given agent and global flag.
 * @param {string} agentKey
 * @param {string} skillName
 * @param {boolean} global
 * @returns {string} absolute or relative path
 */
export function resolveInstallPath(agentKey, skillName, isGlobal) {
  const agent = AGENTS[agentKey]
  if (isGlobal) {
    if (!agent.globalPath) {
      throw new Error(`Global install is not supported for ${agent.name}`)
    }
    return agent.globalPath(skillName)
  }
  return agent.projectPath(skillName)
}
