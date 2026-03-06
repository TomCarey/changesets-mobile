import { execa } from 'execa';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadConfig } from '../config.js';
import { syncIos } from '../platforms/ios.js';
import { syncAndroid } from '../platforms/android.js';

export async function version(): Promise<void> {
  console.log('Running changeset version...');
  await execa('npx', ['changeset', 'version'], { stdio: 'inherit' });

  const pkgPath = resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };
  const newVersion = pkg.version;

  console.log(`Syncing version ${newVersion} to native files...`);

  const config = loadConfig();

  for (const platform of config.platforms) {
    if (platform.platform === 'ios') {
      syncIos(platform, newVersion);
    } else if (platform.platform === 'android') {
      syncAndroid(platform, newVersion);
    }
  }

  console.log('Done.');
}
