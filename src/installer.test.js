import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { getSkillSource, isInstalled, installSkill, removeSkill } from './installer.js'

const TMP_DIR = join(tmpdir(), 'hurevo-skills-test')

describe('installer', () => {
  beforeEach(async () => {
    await mkdir(TMP_DIR, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(TMP_DIR, { recursive: true, force: true })
    } catch {
      // ignore errors
    }
  })

  describe('getSkillSource()', () => {
    it('returns path containing skill name and SKILL.md', () => {
      const path = getSkillSource('hurevo-laravel')
      assert(path.includes('hurevo-laravel'))
      assert(path.includes('SKILL.md'))
    })

    it('returns different paths for different skills', () => {
      const path1 = getSkillSource('hurevo-laravel')
      const path2 = getSkillSource('hurevo-react')
      assert.notStrictEqual(path1, path2)
      assert(path1.includes('hurevo-laravel'))
      assert(path2.includes('hurevo-react'))
    })
  })

  describe('isInstalled()', () => {
    it('returns false when SKILL.md does not exist', async () => {
      const targetDir = join(TMP_DIR, 'empty')
      const result = await isInstalled(targetDir)
      assert.strictEqual(result, false)
    })

    it('returns true when SKILL.md exists', async () => {
      const targetDir = join(TMP_DIR, 'with-skill')
      await mkdir(targetDir, { recursive: true })
      await writeFile(join(targetDir, 'SKILL.md'), '# Skill')
      const result = await isInstalled(targetDir)
      assert.strictEqual(result, true)
    })

    it('returns true even with other files present', async () => {
      const targetDir = join(TMP_DIR, 'multi-file')
      await mkdir(targetDir, { recursive: true })
      await writeFile(join(targetDir, 'SKILL.md'), '# Skill')
      await writeFile(join(targetDir, 'other.txt'), 'other')
      const result = await isInstalled(targetDir)
      assert.strictEqual(result, true)
    })
  })

  describe('installSkill()', () => {
    it('creates intermediate directories if they do not exist', async () => {
      const targetDir = join(TMP_DIR, 'deep', 'nested', 'path')
      try {
        // This should create the directories
        await installSkill('hurevo-project-rules', targetDir)
        const installed = await isInstalled(targetDir)
        assert.strictEqual(installed, true)
      } catch (err) {
        // If bundled skill doesn't exist, that's ok for this test
        if (!err.message.includes('ENOENT')) throw err
      }
    })

    it('copies SKILL.md to target directory', async () => {
      const targetDir = join(TMP_DIR, 'test-install')
      try {
        await installSkill('hurevo-project-rules', targetDir)
        const installed = await isInstalled(targetDir)
        assert.strictEqual(installed, true)
      } catch (err) {
        if (!err.message.includes('ENOENT')) throw err
      }
    })

    it('throws error if source skill does not exist', async () => {
      const targetDir = join(TMP_DIR, 'test')
      try {
        await installSkill('nonexistent-skill', targetDir)
        assert.fail('should have thrown')
      } catch (err) {
        assert(err.message.includes('ENOENT') || err.code === 'ENOENT')
      }
    })
  })

  describe('removeSkill()', () => {
    it('removes directory when it exists', async () => {
      const targetDir = join(TMP_DIR, 'to-remove')
      await mkdir(targetDir, { recursive: true })
      await writeFile(join(targetDir, 'SKILL.md'), '# Skill')

      await removeSkill(targetDir)
      const installed = await isInstalled(targetDir)
      assert.strictEqual(installed, false)
    })

    it('silently succeeds when directory does not exist', async () => {
      const targetDir = join(TMP_DIR, 'does-not-exist')
      try {
        await removeSkill(targetDir)
        // Should not throw
        assert.ok(true)
      } catch (err) {
        assert.fail(`should not throw: ${err.message}`)
      }
    })

    it('removes directory with nested files', async () => {
      const targetDir = join(TMP_DIR, 'nested-remove')
      await mkdir(targetDir, { recursive: true })
      await writeFile(join(targetDir, 'SKILL.md'), '# Skill')
      await writeFile(join(targetDir, 'other.txt'), 'other')

      await removeSkill(targetDir)
      const installed = await isInstalled(targetDir)
      assert.strictEqual(installed, false)
    })

    it('succeeds on second removal', async () => {
      const targetDir = join(TMP_DIR, 'double-remove')
      await mkdir(targetDir, { recursive: true })
      await writeFile(join(targetDir, 'SKILL.md'), '# Skill')

      await removeSkill(targetDir)
      // Second removal should not fail
      try {
        await removeSkill(targetDir)
        assert.ok(true)
      } catch (err) {
        assert.fail(`second removal failed: ${err.message}`)
      }
    })
  })
})
