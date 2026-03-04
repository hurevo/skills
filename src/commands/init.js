import chalk from 'chalk'
import { SERVICE_SKILL_SETS, SERVICE_NAMES } from '../registry.js'
import { add } from './add.js'

/**
 * Initialise a project with the recommended skill set for a Hurevo service type.
 * @param {{ service: string, agent: string }} opts
 */
export const init = async (opts) => {
  if (!opts.service) {
    console.error(chalk.red('--service is required'))
    console.error(chalk.dim(`Valid options: ${SERVICE_NAMES.join(', ')}`))
    process.exit(1)
  }

  const skillSet = SERVICE_SKILL_SETS[opts.service]
  if (!skillSet) {
    console.error(chalk.red(`Unknown service type "${opts.service}"`))
    console.error(chalk.dim(`Valid options: ${SERVICE_NAMES.join(', ')}`))
    process.exit(1)
  }

  console.log(chalk.bold(`Initialising ${opts.service} skill set (${skillSet.length} skills)…`))
  console.log('')

  await add(skillSet, { global: false, agent: opts.agent ?? 'all' })

  console.log('')
  console.log(chalk.green(`✔ ${opts.service} skill set installed.`))
  console.log(chalk.dim('  Run "hurevo-skills list --installed" to review.'))
}
