#!/usr/bin/env node

import { init } from './commands/init.js';
import { version } from './commands/version.js';

const command = process.argv[2];

async function main() {
  switch (command) {
    case 'init':
      await init();
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
