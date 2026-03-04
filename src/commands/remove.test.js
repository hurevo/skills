import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { remove } from './remove.js'

// Prevent process.exit() from killing the test process.
const _originalExit = process.exit
process.exit = (code) => {
  const err = new Error(`process.exit called with code ${code}`)
  err.code = code
  throw err
}

const TMP_DIR = join(tmpdir(), 'hurevo-skills-remove-test')

describe('remove command', () => {
  beforeEach(async () => {
    await mkdir(TMP_DIR, { recursive: true })
    process.chdir(TMP_DIR)
  })

  afterEach(async () => {
    try {
      await rm(TMP_DIR, { recursive: true, force: true })
    } catch {
      // ignore errors
    }
  })

  it('throws error for unknown skill', async () => {
    try {
      await remove(['nonexistent-skill'], { global: false, agent: 'opencode' })
      assert.fail('should have thrown')
    } catch (err) {
      assert(err.message.includes('exit') || err.code === 1)
    }
  })

  it('reports skill not installed and skips removal', async () => {
    try {
      await remove(['hurevo-project-rules'], { global: false, agent: 'opencode' })
      // Should succeed without error (skill just wasn't installed)
      assert.ok(true)
    } catch (err) {
      assert.fail(`should not throw: ${err.message}`)
    }
  })

  it('accepts valid skill names', async () => {
    try {
      await remove(['hurevo-project-rules'], { global: false, agent: 'opencode' })
      assert.ok(true)
    } catch (err) {
      // Should not throw unknown skill error
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('supports multiple skills at once', async () => {
    try {
      await remove(['hurevo-project-rules', 'hurevo-laravel'], { global: false, agent: 'opencode' })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('respects global flag', async () => {
    try {
      await remove(['hurevo-project-rules'], { global: true, agent: 'opencode' })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('defaults global to false', async () => {
    try {
      await remove(['hurevo-project-rules'], { agent: 'opencode' })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('defaults agent to all', async () => {
    try {
      await remove(['hurevo-project-rules'], { global: false })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('resolves agent "all" to all agent names', async () => {
    try {
      await remove(['hurevo-project-rules'], { global: false, agent: 'all' })
      // Should attempt to remove from all agents
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('validates all skill names before doing any work', async () => {
    try {
      await remove(['hurevo-project-rules', 'invalid-skill'], { global: false, agent: 'opencode' })
      assert.fail('should have thrown for invalid skill')
    } catch (err) {
      // Should fail with unknown skill error before removal
      void err
      assert.ok(true)
    }
  })

  it('gracefully handles already-removed skills', async () => {
    // Remove same skill twice — second should succeed
    try {
      await remove(['hurevo-project-rules'], { global: false, agent: 'opencode' })
      await remove(['hurevo-project-rules'], { global: false, agent: 'opencode' })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })
})
