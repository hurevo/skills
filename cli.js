#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

// Lazy-load commands so startup is fast for --help
program
  .name('hurevo-skills')
  .description('Hurevo AI coding skills manager — installs skills for OpenCode, Claude Code, Cursor, and Windsurf')
  .version(pkg.version);

program
  .command('add <skill...>')
  .description('Install one or more skills into the current project or globally')
  .option('-g, --global', 'Install to global config (~/.config/opencode/skills/)')
  .option('--agent <agent>', 'Target agent: opencode | claude | cursor | windsurf | all', 'all')
  .example('hurevo-skills add hurevo-laravel')
  .example('hurevo-skills add hurevo-laravel hurevo-project-rules')
  .example('hurevo-skills add hurevo-ai-solution --global')
  .example('hurevo-skills add hurevo-automation --agent claude')
  .action(async (skills, opts) => {
    const { add } = await import('./src/commands/add.js');
    await add(skills, opts);
  });

program
  .command('remove <skill...>')
  .description('Remove installed skills from current project or global config')
  .option('-g, --global', 'Remove from global config')
  .option('--agent <agent>', 'Target agent: opencode | claude | cursor | windsurf | all', 'all')
  .action(async (skills, opts) => {
    const { remove } = await import('./src/commands/remove.js');
    await remove(skills, opts);
  });

program
  .command('list')
  .description('List all available skills and their installation status')
  .option('--installed', 'Show only installed skills')
  .action(async (opts) => {
    const { list } = await import('./src/commands/list.js');
    await list(opts);
  });

program
  .command('init')
  .description('Initialize project with recommended Hurevo skills based on service type')
  .option('--service <type>', 'Hurevo service type: laravel | automation | ai | modernization')
  .option('--agent <agent>', 'Target agent: opencode | claude | cursor | windsurf | all', 'all')
  .action(async (opts) => {
    const { init } = await import('./src/commands/init.js');
    await init(opts);
  });

program
  .command('sync')
  .description('Sync installed skills across all agent formats in current project')
  .action(async () => {
    const { sync } = await import('./src/commands/sync.js');
    await sync();
  });

program
  .command('update [skill...]')
  .description('Update skills to the latest version bundled in @hurevo/skills')
  .option('-g, --global', 'Update global skills')
  .action(async (skills, opts) => {
    const { update } = await import('./src/commands/update.js');
    await update(skills, opts);
  });

program.addHelpText(
  'after',
  `
Examples:
  $ npx @hurevo/skills add hurevo-laravel
  $ npx @hurevo/skills add hurevo-project-rules hurevo-automation
  $ npx @hurevo/skills init --service laravel
  $ npx @hurevo/skills list
  $ npx @hurevo/skills sync
  $ npx @hurevo/skills update
`,
);

program.parse();
