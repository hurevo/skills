import chalk from 'chalk'
import ora from 'ora'
import { SKILLS } from '../registry.js'
import { resolveAgents, resolveInstallPath } from '../agents.js'
import { installSkill, getSkillSource } from '../installer.js'
import { access } from 'fs/promises'

/**
 * Install one or more skills to agent directories.
 * @param {string[]} skills
 * @param {{ global: boolean, agent: string }} opts
 */
export const add = async (skills, opts) => {
  const isGlobal = opts.global ?? false
  const agentKeys = resolveAgents(opts.agent ?? 'all')

  // Validate all skill names up front before doing any work
  const unknown = skills.filter((s) => !SKILLS[s])
  if (unknown.length > 0) {
    console.error(chalk.red(`Unknown skill(s): ${unknown.join(', ')}`))
    console.error(chalk.dim('Run "hurevo-skills list" to see available skills'))
    process.exit(1)
  }

  // Validate bundled sources exist
  for (const skillName of skills) {
    try {
      await access(getSkillSource(skillName))
    } catch {
      console.error(chalk.red(`Skill "${skillName}" is registered but SKILL.md is missing from the package.`))
      process.exit(1)
    }
  }

  for (const skillName of skills) {
    for (const agentKey of agentKeys) {
      const targetDir = resolveInstallPath(agentKey, skillName, isGlobal)
      const spinner = ora(`Installing ${chalk.cyan(skillName)} → ${chalk.dim(targetDir)}`).start()
      try {
        await installSkill(skillName, targetDir)
        spinner.succeed(`${chalk.green(skillName)} installed for ${chalk.bold(agentKey)}`)
      } catch (err) {
        spinner.fail(`Failed to install ${skillName} for ${agentKey}: ${err.message}`)
        process.exit(1)
      }
    }
  }
}
