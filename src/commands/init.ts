import { createInterface } from 'readline';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { IosPlatformConfig, AndroidPlatformConfig } from '../config.js';

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
      const infoPlist = await prompt(rl, 'Path to Info.plist [ios/App/Info.plist]: ');
      const pbxproj = await prompt(rl, 'Path to project.pbxproj [ios/App.xcodeproj/project.pbxproj]: ');
      const buildNumberInput = await prompt(rl, 'Build number strategy (auto, skip, or a fixed integer) [auto]: ');

      const bn = buildNumberInput.trim() || 'auto';
      const iosConfig: IosPlatformConfig = {
        platform: 'ios',
        infoPlist: infoPlist.trim() || 'ios/App/Info.plist',
        pbxproj: pbxproj.trim() || 'ios/App.xcodeproj/project.pbxproj',
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
