#!/usr/bin/env node

import { init } from './commands/init.js';
import { version } from './commands/version.js';

const args = process.argv.slice(2);
const command = args[0];

function getFlag(name: string): string | undefined {
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  if (idx !== -1) return args[idx + 1];
  const prefix = `--${name}=`;
  const inline = args.find((a) => a.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : undefined;
}

async function main() {
  switch (command) {
    case 'init':
      await init({ initialVersion: getFlag('version') });
      break;
    case 'version':
      await version();
      break;
    default:
      console.error(`Unknown command: ${command ?? '(none)'}`);
      console.error('Usage: changeset-mobile <init|version>');
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
