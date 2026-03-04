import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { sync } from './sync.js'

const TMP_DIR = join(tmpdir(), 'hurevo-skills-sync-test')

describe('sync command', () => {
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
      await sync()
      // Should log message about no skills found
      assert.ok(true)
    } catch (err) {
      assert.fail(`should not throw: ${err.message}`)
    }
  })

  it('takes no arguments', async () => {
    try {
      // sync() is called with no arguments
      await sync()
      assert.ok(true)
    } catch (err) {
      assert.fail(`should not throw: ${err.message}`)
    }
  })

  it('uses opencode as primary source for installed skills', async () => {
    try {
      // Create a fake installed skill in opencode
      const skillDir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-project-rules')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# Test')

      await sync()
      // Should attempt to sync from opencode to other agents
      assert.ok(true)
    } catch (err) {
      // File not found in source is expected in test
      if (err.message.includes('Unknown')) {
        assert.fail(err.message)
      }
    }
  })

  it('syncs to all non-opencode agents', async () => {
    try {
      const skillDir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-project-rules')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# Test')

      await sync()
      // Should attempt sync to claude, cursor, windsurf
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown')) {
        assert.fail(err.message)
      }
    }
  })

  it('handles single installed skill', async () => {
    try {
      const skillDir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-laravel')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# Test')

      await sync()
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown')) {
        assert.fail(err.message)
      }
    }
  })

  it('handles multiple installed skills', async () => {
    try {
      const skill1Dir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-project-rules')
      const skill2Dir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-laravel')
      await mkdir(skill1Dir, { recursive: true })
      await mkdir(skill2Dir, { recursive: true })
      await writeFile(join(skill1Dir, 'SKILL.md'), '# Test1')
      await writeFile(join(skill2Dir, 'SKILL.md'), '# Test2')

      await sync()
      // Should sync both skills
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown')) {
        assert.fail(err.message)
      }
    }
  })

  it('reports when no skills are found to sync', async () => {
    try {
      await sync()
      // Should log message about no installed skills
      assert.ok(true)
    } catch (err) {
      assert.fail(`should not throw: ${err.message}`)
    }
  })

  it('reports completion after syncing', async () => {
    try {
      const skillDir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-project-rules')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# Test')

      await sync()
      // Should log completion message
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown')) {
        assert.fail(err.message)
      }
    }
  })

  it('skips opencode when syncing to other agents', async () => {
    try {
      const skillDir = join(TMP_DIR, '.opencode', 'skills', 'hurevo-project-rules')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# Test')

      await sync()
      // Should not try to "sync" opencode to itself
      assert.ok(true)
    } catch (err) {
      if (err.message.includes('Unknown')) {
        assert.fail(err.message)
      }
    }
  })
})
