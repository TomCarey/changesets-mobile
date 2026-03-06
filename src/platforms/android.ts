import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { AndroidPlatformConfig } from '../config.js';

function readFile(filePath: string): string {
  return readFileSync(resolve(process.cwd(), filePath), 'utf-8');
}

function writeFile(filePath: string, content: string): void {
  writeFileSync(resolve(process.cwd(), filePath), content, 'utf-8');
}

function getCurrentVersionCode(content: string): number {
  // Matches both Groovy (`versionCode 123`) and KTS (`versionCode = 123`)
  const match = content.match(/versionCode\s*=?\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function syncAndroid(config: AndroidPlatformConfig, version: string): void {
  let content = readFile(config.buildGradle);

  let versionCode: number | undefined;
  if (config.versionCode === 'auto') {
    versionCode = getCurrentVersionCode(content) + 1;
  } else if (config.versionCode !== undefined) {
    versionCode = config.versionCode;
  }

  // Update versionName — handles both Groovy (`versionName "1.0"`) and KTS (`versionName = "1.0"`)
  content = content.replace(/(versionName\s*=?\s*)"[^"]*"/, `$1"${version}"`);

  if (versionCode !== undefined) {
    // Update versionCode — handles both Groovy (`versionCode 1`) and KTS (`versionCode = 1`)
    content = content.replace(/(versionCode\s*=?\s*)\d+/, `$1${versionCode}`);
  }

  writeFile(config.buildGradle, content);

  const buildInfo = versionCode !== undefined ? ` (versionCode ${versionCode})` : '';
  console.log(`  [Android] Updated to ${version}${buildInfo}`);
}
