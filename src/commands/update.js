import chalk from 'chalk'
import ora from 'ora'
import { SKILLS, SKILL_NAMES } from '../registry.js'
import { AGENT_NAMES, resolveInstallPath } from '../agents.js'
import { isInstalled, installSkill } from '../installer.js'

/**
 * Update skills to the latest version bundled in the package.
 * If no skills are specified, updates all currently installed skills.
 * @param {string[]} skills - specific skill names, or empty for all installed
 * @param {{ global: boolean }} opts
 */
export const update = async (skills, opts) => {
  const isGlobal = opts.global ?? false

  // Validate any explicitly named skills
  if (skills.length > 0) {
    const unknown = skills.filter((s) => !SKILLS[s])
    if (unknown.length > 0) {
      console.error(chalk.red(`Unknown skill(s): ${unknown.join(', ')}`))
      console.error(chalk.dim('Run "hurevo-skills list" to see available skills'))
      process.exit(1)
    }
  }

  // Discover which skills to update
  let targets = skills

  if (targets.length === 0) {
    // Update all installed skills across all agents
    for (const skillName of SKILL_NAMES) {
      for (const agentKey of AGENT_NAMES) {
        const dir = resolveInstallPath(agentKey, skillName, isGlobal)
        if (await isInstalled(dir)) {
          if (!targets.includes(skillName)) targets.push(skillName)
          break
        }
      }
    }
  }

  if (targets.length === 0) {
    console.log(chalk.yellow('No installed skills found to update.'))
    console.log(chalk.dim('Run "hurevo-skills add <skill>" first.'))
    return
  }

  console.log(chalk.bold(`Updating ${targets.length} skill(s)…`))
  console.log('')

  for (const skillName of targets) {
    for (const agentKey of AGENT_NAMES) {
      const targetDir = resolveInstallPath(agentKey, skillName, isGlobal)
      if (!(await isInstalled(targetDir))) continue

      const spinner = ora(`Updating ${chalk.cyan(skillName)} for ${chalk.bold(agentKey)}`).start()
      try {
        await installSkill(skillName, targetDir)
        spinner.succeed(`${chalk.green(skillName)} updated for ${chalk.bold(agentKey)}`)
      } catch (err) {
        spinner.fail(`${skillName} for ${agentKey}: ${err.message}`)
      }
    }
  }

  console.log('')
  console.log(chalk.green('✔ Update complete.'))
}
