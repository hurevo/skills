import chalk from 'chalk'
import ora from 'ora'
import { SKILL_NAMES } from '../registry.js'
import { AGENT_NAMES, resolveInstallPath } from '../agents.js'
import { isInstalled, installSkill } from '../installer.js'

/**
 * Sync all skills installed in the OpenCode agent dir to all other agent dirs.
 * OpenCode is used as the primary source of truth for "what is installed".
 */
export const sync = async () => {
  // Find which skills are installed (opencode = primary)
  const installedSkills = []
  for (const skillName of SKILL_NAMES) {
    const dir = resolveInstallPath('opencode', skillName, false)
    if (await isInstalled(dir)) {
      installedSkills.push(skillName)
    }
  }

  if (installedSkills.length === 0) {
    console.log(chalk.yellow('No installed skills found to sync.'))
    console.log(chalk.dim('Run "hurevo-skills add <skill>" first.'))
    return
  }

  console.log(chalk.bold(`Syncing ${installedSkills.length} skill(s) across all agents…`))
  console.log('')

  // Secondary agents — sync to all except opencode (already the source)
  const targetAgents = AGENT_NAMES.filter((a) => a !== 'opencode')

  for (const skillName of installedSkills) {
    for (const agentKey of targetAgents) {
      const targetDir = resolveInstallPath(agentKey, skillName, false)
      const spinner = ora(`${chalk.cyan(skillName)} → ${chalk.bold(agentKey)}`).start()
      try {
        await installSkill(skillName, targetDir)
        spinner.succeed(`${skillName} → ${agentKey}`)
      } catch (err) {
        spinner.fail(`${skillName} → ${agentKey}: ${err.message}`)
      }
    }
  }

  console.log('')
  console.log(chalk.green('✔ Sync complete.'))
}
