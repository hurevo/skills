import { describe, it } from 'node:test'
import assert from 'node:assert'
import { AGENTS, AGENT_NAMES, resolveAgents, resolveInstallPath } from '../src/agents.js'
import { homedir } from 'os'

describe('agents', () => {
  describe('AGENTS object', () => {
    it('has opencode, claude, cursor, windsurf keys', () => {
      assert.deepEqual(Object.keys(AGENTS).sort(), ['claude', 'cursor', 'opencode', 'windsurf'].sort())
    })

    it('defines projectPath for all agents', () => {
      for (const agent of Object.values(AGENTS)) {
        assert.strictEqual(typeof agent.projectPath, 'function')
        const path = agent.projectPath('test-skill')
        assert(path.includes('test-skill'))
      }
    })

    it('defines globalPath (may be null for some agents)', () => {
      for (const agent of Object.values(AGENTS)) {
        assert(agent.globalPath === null || typeof agent.globalPath === 'function')
      }
    })

    it('opencode has globalPath in .config/opencode', () => {
      const path = AGENTS.opencode.globalPath('test-skill')
      assert(path.includes(homedir()))
      assert(path.includes('.config'))
      assert(path.includes('opencode'))
    })

    it('claude and cursor have null globalPath', () => {
      assert.strictEqual(AGENTS.claude.globalPath, null)
      assert.strictEqual(AGENTS.cursor.globalPath, null)
    })
  })

  describe('AGENT_NAMES', () => {
    it('contains all agent keys', () => {
      assert.deepEqual(AGENT_NAMES.sort(), Object.keys(AGENTS).sort())
    })
  })

  describe('resolveAgents()', () => {
    it('returns array with single agent for valid agent name', () => {
      assert.deepEqual(resolveAgents('opencode'), ['opencode'])
      assert.deepEqual(resolveAgents('claude'), ['claude'])
    })

    it('returns all agents when passed "all"', () => {
      const result = resolveAgents('all')
      assert.deepEqual(result.sort(), AGENT_NAMES.sort())
    })

    it('throws error for unknown agent', () => {
      assert.throws(() => resolveAgents('unknown'), /Unknown agent/)
    })

    it('error message lists valid options', () => {
      try {
        resolveAgents('invalid')
        assert.fail('should have thrown')
      } catch (err) {
        assert(err.message.includes('opencode'))
        assert(err.message.includes('claude'))
      }
    })
  })

  describe('resolveInstallPath()', () => {
    it('returns project path when global is false', () => {
      const path = resolveInstallPath('opencode', 'test-skill', false)
      assert(path.includes('.opencode'))
      assert(path.includes('skills'))
      assert(path.includes('test-skill'))
      assert(!path.startsWith('/'))
    })

    it('returns global path when global is true and agent supports it', () => {
      const path = resolveInstallPath('opencode', 'test-skill', true)
      assert(path.includes(homedir()))
      assert(path.includes('.config'))
    })

    it('throws when global=true for an agent that does not support global installs', () => {
      assert.throws(
        () => resolveInstallPath('claude', 'test-skill', true),
        /Global install is not supported/
      )
    })
  })
})
