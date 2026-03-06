import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface IosPlatformConfig {
  platform: 'ios';
  infoPlist: string;
  pbxproj: string;
  buildNumber?: 'auto' | number;
}

export interface AndroidPlatformConfig {
  platform: 'android';
  buildGradle: string;
  versionCode?: 'auto' | number;
}

export type PlatformConfig = IosPlatformConfig | AndroidPlatformConfig;

export interface Config {
  platforms: PlatformConfig[];
}

export function loadConfig(): Config {
  const configPath = resolve(process.cwd(), 'changeset-mobile.config.json');

  let raw: string;
  try {
    raw = readFileSync(configPath, 'utf-8');
  } catch {
    throw new Error('changeset-mobile.config.json not found. Run `changeset-mobile init` first.');
  }

  // Strip line comments before parsing
  const stripped = raw.replace(/^\s*\/\/.*$/gm, '');

  let config: Config;
  try {
    config = JSON.parse(stripped) as Config;
  } catch {
    throw new Error('Failed to parse changeset-mobile.config.json — check for syntax errors.');
  }

  validateConfig(config);
  return config;
}

function validateConfig(config: Config): void {
  if (!Array.isArray(config.platforms)) {
    throw new Error('Config must have a "platforms" array.');
  }

  for (const p of config.platforms) {
    if (p.platform === 'ios') {
      if (!p.infoPlist) throw new Error('iOS config requires "infoPlist".');
      if (!p.pbxproj) throw new Error('iOS config requires "pbxproj".');
    } else if (p.platform === 'android') {
      if (!p.buildGradle) throw new Error('Android config requires "buildGradle".');
    } else {
      throw new Error(`Unknown platform: ${(p as { platform: string }).platform}`);
    }
  }
}
