import chalk from 'chalk'
import { SKILLS, SKILL_NAMES } from '../registry.js'
import { resolveInstallPath } from '../agents.js'
import { isInstalled } from '../installer.js'

const CATEGORY_ORDER = ['core', 'service', 'quality', 'compliance', 'workflow', 'branding']

/**
 * List all available skills and their installation status.
 * @param {{ installed: boolean }} opts
 */
export const list = async (opts) => {
  const showInstalledOnly = opts.installed ?? false

  // Check installation status against opencode project paths (primary agent)
  const statuses = await Promise.all(
    SKILL_NAMES.map(async (name) => {
      const dir = resolveInstallPath('opencode', name, false)
      const installed = await isInstalled(dir)
      return { name, installed, ...SKILLS[name] }
    })
  )

  const filtered = showInstalledOnly ? statuses.filter((s) => s.installed) : statuses

  if (filtered.length === 0) {
    console.log(chalk.dim('No installed skills found. Run "hurevo-skills add <skill>" to install.'))
    return
  }

  // Group by category
  const grouped = {}
  for (const skill of filtered) {
    if (!grouped[skill.category]) grouped[skill.category] = []
    grouped[skill.category].push(skill)
  }

  console.log('')
  for (const category of CATEGORY_ORDER) {
    if (!grouped[category]) continue
    console.log(chalk.bold.underline(category.toUpperCase()))
    for (const skill of grouped[category]) {
      const status = skill.installed
        ? chalk.green('✔ installed')
        : chalk.dim('  available')
      const name = skill.installed ? chalk.cyan(skill.name) : skill.name
      console.log(`  ${status}  ${name.padEnd(36)}${chalk.dim(skill.description)}`)
    }
    console.log('')
  }
}
