import chalk from 'chalk'
import ora from 'ora'
import { SKILLS } from '../registry.js'
import { resolveAgents, resolveInstallPath } from '../agents.js'
import { removeSkill, isInstalled } from '../installer.js'

/**
 * Remove one or more skills from agent directories.
 * @param {string[]} skills
 * @param {{ global: boolean, agent: string }} opts
 */
export const remove = async (skills, opts) => {
  const isGlobal = opts.global ?? false
  const agentKeys = resolveAgents(opts.agent ?? 'all')

  const unknown = skills.filter((s) => !SKILLS[s])
  if (unknown.length > 0) {
    console.error(chalk.red(`Unknown skill(s): ${unknown.join(', ')}`))
    console.error(chalk.dim('Run "hurevo-skills list" to see available skills'))
    process.exit(1)
  }

  for (const skillName of skills) {
    for (const agentKey of agentKeys) {
      const targetDir = resolveInstallPath(agentKey, skillName, isGlobal)
      const installed = await isInstalled(targetDir)

      if (!installed) {
        console.log(chalk.yellow(`${skillName} is not installed for ${agentKey} — skipping`))
        continue
      }

      const spinner = ora(`Removing ${chalk.cyan(skillName)} from ${chalk.bold(agentKey)}`).start()
      try {
        await removeSkill(targetDir)
        spinner.succeed(`${chalk.green(skillName)} removed from ${chalk.bold(agentKey)}`)
      } catch (err) {
        spinner.fail(`Failed to remove ${skillName} from ${agentKey}: ${err.message}`)
        process.exit(1)
      }
    }
  }
}
