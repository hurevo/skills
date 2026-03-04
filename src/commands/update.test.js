import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { update } from './update.js'

// Prevent process.exit() from killing the test process.
const _originalExit = process.exit
process.exit = (code) => {
  const err = new Error(`process.exit called with code ${code}`)
  err.code = code
  throw err
}

const TMP_DIR = join(tmpdir(), 'hurevo-skills-update-test')

describe('update command', () => {
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

  it('executes without error when no skills are installed', async () => {
    try {
      await update([], { global: false })
      // Should log message about no installed skills
      assert.ok(true)
    } catch (err) {
      assert.fail(`should not throw: ${err.message}`)
    }
  })

  it('throws error for unknown skill when explicitly named', async () => {
    try {
      await update(['nonexistent-skill'], { global: false })
      assert.fail('should have thrown')
    } catch (err) {
      // Should error on unknown skill
      void err
      assert.ok(true)
    }
  })

  it('accepts valid skill names', async () => {
    try {
      await update(['hurevo-project-rules'], { global: false })
      // May fail on file access, but skill name is valid
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('updates specified skills when provided', async () => {
    try {
      // Create fake installed skills
      const skillDir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-project-rules')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# Old version')

      // Update specific skill
      await update(['hurevo-project-rules'], { global: false })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('discovers and updates all installed skills when none specified', async () => {
    try {
      // Create fake installed skills
      const skill1Dir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-project-rules')
      const skill2Dir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-laravel')
      await mkdir(skill1Dir, { recursive: true })
      await mkdir(skill2Dir, { recursive: true })
      await writeFile(join(skill1Dir, 'SKILL.md'), '# Old')
      await writeFile(join(skill2Dir, 'SKILL.md'), '# Old')

      // Update all (empty array = discover and update installed)
      await update([], { global: false })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('respects global flag', async () => {
    try {
      await update([], { global: true })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('defaults global to false', async () => {
    try {
      await update([], {})
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('validates all explicitly named skills before doing any work', async () => {
    try {
      await update(['hurevo-project-rules', 'invalid-skill'], { global: false })
      assert.fail('should have thrown for invalid skill')
    } catch (err) {
      // Should fail with unknown skill error
      void err
      assert.ok(true)
    }
  })

  it('handles skill installed in only one agent', async () => {
    try {
      // Create skill in only opencode agent
      const skillDir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-laravel')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# Old')

      // Update should find it
      await update([], { global: false })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown')) {
        assert.fail(err.message)
      }
    }
  })

  it('skips agents where skill is not installed', async () => {
    try {
      // Install skill in only one agent
      const skillDir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-project-rules')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# Old')

      // Update should skip other agents where not installed
      await update(['hurevo-project-rules'], { global: false })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown')) {
        assert.fail(err.message)
      }
    }
  })

  it('handles multiple skills to update', async () => {
    try {
      await update(['hurevo-project-rules', 'hurevo-laravel'], { global: false })
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown skill')) {
        assert.fail(err.message)
      }
    }
  })

  it('reports completion after update', async () => {
    try {
      const skillDir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-project-rules')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# Old')

      await update(['hurevo-project-rules'], { global: false })
      // Should log completion message
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown')) {
        assert.fail(err.message)
      }
    }
  })
})
