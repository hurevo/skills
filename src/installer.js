import { copyFile, mkdir, rm, access } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILLS_DIR = join(__dirname, '..', 'skills')
const SKILL_FILENAME = 'SKILL.md'

/**
 * Resolve the bundled source path for a skill.
 * @param {string} skillName
 * @returns {string}
 */
export function getSkillSource(skillName) {
  return join(SKILLS_DIR, skillName, SKILL_FILENAME)
}

/**
 * Check whether a skill is installed at the given target directory.
 * @param {string} targetDir - absolute or cwd-relative path to the skill dir
 * @returns {Promise<boolean>}
 */
export async function isInstalled(targetDir) {
  try {
    const absPath = targetDir.startsWith('/')
      ? join(targetDir, SKILL_FILENAME)
      : join(process.cwd(), targetDir, SKILL_FILENAME)
    await access(absPath)
    return true
  } catch {
    return false
  }
}

/**
 * Install a skill by copying SKILL.md from the bundled source to targetDir.
 * Creates intermediate directories as needed.
 * @param {string} skillName
 * @param {string} targetDir - absolute or cwd-relative path
 */
export async function installSkill(skillName, targetDir) {
  const src = getSkillSource(skillName)
  const dest = targetDir.startsWith('/')
    ? join(targetDir, SKILL_FILENAME)
    : join(process.cwd(), targetDir, SKILL_FILENAME)

  await mkdir(dirname(dest), { recursive: true })
  await copyFile(src, dest)
}

/**
 * Remove an installed skill directory.
 * Silently succeeds if the directory does not exist.
 * @param {string} targetDir - absolute or cwd-relative path
 */
export async function removeSkill(targetDir) {
  const absPath = targetDir.startsWith('/')
    ? targetDir
    : join(process.cwd(), targetDir)

  try {
    await rm(absPath, { recursive: true, force: true })
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}
