import { createInterface } from 'readline';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join, relative } from 'path';
import type { IosPlatformConfig, AndroidPlatformConfig } from '../config.js';

function findXcodeproj(dir: string, depth = 0): string | undefined {
  if (depth > 3) return undefined;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    if (entry.isDirectory()) {
      if (entry.name.endsWith('.xcodeproj')) return join(dir, entry.name);
      const found = findXcodeproj(join(dir, entry.name), depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

function findInfoPlist(dir: string, depth = 0): string | undefined {
  if (depth > 3) return undefined;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    if (entry.isFile() && entry.name === 'Info.plist') return join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.endsWith('.xcodeproj')) {
      const found = findInfoPlist(join(dir, entry.name), depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

function prompt(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((res) => rl.question(question, res));
}

export function setPackageVersion(version: string): void {
  const pkgPath = resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Set package.json version to ${version}`);
}

export async function init(options: { initialVersion?: string } = {}): Promise<void> {
  const configPath = resolve(process.cwd(), 'changeset-mobile.config.json');

  if (existsSync(configPath)) {
    console.log('changeset-mobile.config.json already exists.');
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const platforms: (IosPlatformConfig | AndroidPlatformConfig)[] = [];

  try {
    const platformsInput = await prompt(rl, 'Which platforms? (ios, android, both) [both]: ');
    const choice = platformsInput.trim().toLowerCase() || 'both';

    if (choice === 'ios' || choice === 'both') {
      const cwd = process.cwd();
      const xcodeproj = findXcodeproj(cwd);
      const defaultPbxproj = xcodeproj
        ? relative(cwd, join(xcodeproj, 'project.pbxproj'))
        : 'ios/App.xcodeproj/project.pbxproj';
      const defaultInfoPlist = xcodeproj
        ? (findInfoPlist(resolve(xcodeproj, '..')) ?? '')
          .replace(cwd + '/', '')
        : '';

      const pbxprojInput = await prompt(rl, `Path to project.pbxproj [${defaultPbxproj}]: `);
      const infoPlistInput = await prompt(rl, `Path to Info.plist (leave blank to skip) [${defaultInfoPlist || 'none'}]: `);
      const buildNumberInput = await prompt(rl, 'Build number strategy (auto, skip, or a fixed integer) [auto]: ');

      const bn = buildNumberInput.trim() || 'auto';
      const resolvedInfoPlist = infoPlistInput.trim() || defaultInfoPlist || undefined;
      const iosConfig: IosPlatformConfig = {
        platform: 'ios',
        ...(resolvedInfoPlist ? { infoPlist: resolvedInfoPlist } : {}),
        pbxproj: pbxprojInput.trim() || defaultPbxproj,
      };
      if (bn !== 'skip') {
        iosConfig.buildNumber = bn === 'auto' ? 'auto' : parseInt(bn, 10);
      }
      platforms.push(iosConfig);
    }

    if (choice === 'android' || choice === 'both') {
      const buildGradle = await prompt(rl, 'Path to build.gradle [android/app/build.gradle]: ');
      const versionCodeInput = await prompt(rl, 'Version code strategy (auto, skip, or a fixed integer) [auto]: ');

      const vc = versionCodeInput.trim() || 'auto';
      const androidConfig: AndroidPlatformConfig = {
        platform: 'android',
        buildGradle: buildGradle.trim() || 'android/app/build.gradle',
      };
      if (vc !== 'skip') {
        androidConfig.versionCode = vc === 'auto' ? 'auto' : parseInt(vc, 10);
      }
      platforms.push(androidConfig);
    }
  } finally {
    rl.close();
  }

  writeFileSync(configPath, JSON.stringify({ platforms }, null, 2) + '\n');
  console.log('Created changeset-mobile.config.json');

  if (options.initialVersion) {
    setPackageVersion(options.initialVersion);
  }
}
