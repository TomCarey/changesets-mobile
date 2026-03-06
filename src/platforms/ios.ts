import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { IosPlatformConfig } from '../config.js';

function readFile(filePath: string): string {
  return readFileSync(resolve(process.cwd(), filePath), 'utf-8');
}

function writeFile(filePath: string, content: string): void {
  writeFileSync(resolve(process.cwd(), filePath), content, 'utf-8');
}

function getCurrentBuildNumberFromPlist(plistContent: string): number {
  const match = plistContent.match(/<key>CFBundleVersion<\/key>\s*<string>(\d+)<\/string>/);
  return match ? parseInt(match[1], 10) : 0;
}

function getCurrentBuildNumberFromPbxproj(pbxprojContent: string): number {
  const match = pbxprojContent.match(/CURRENT_PROJECT_VERSION = (\d+);/);
  return match ? parseInt(match[1], 10) : 0;
}

export function syncIos(config: IosPlatformConfig, version: string): void {
  // Compute build number once so Info.plist and pbxproj stay in sync
  let buildNumber: number | undefined;
  if (config.buildNumber === 'auto') {
    if (config.infoPlist) {
      buildNumber = getCurrentBuildNumberFromPlist(readFile(config.infoPlist)) + 1;
    } else {
      buildNumber = getCurrentBuildNumberFromPbxproj(readFile(config.pbxproj)) + 1;
    }
  } else if (config.buildNumber !== undefined) {
    buildNumber = config.buildNumber;
  }

  if (config.infoPlist) {
    syncInfoPlist(config.infoPlist, version, buildNumber);
  }
  syncPbxproj(config.pbxproj, version, buildNumber);

  const buildInfo = buildNumber !== undefined ? ` (build ${buildNumber})` : '';
  console.log(`  [iOS] Updated to ${version}${buildInfo}`);
}

function syncInfoPlist(filePath: string, version: string, buildNumber: number | undefined): void {
  let content = readFile(filePath);

  content = content.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*/,
    `$1${version}`
  );

  if (buildNumber !== undefined) {
    content = content.replace(
      /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*/,
      `$1${buildNumber}`
    );
  }

  writeFile(filePath, content);
}

function syncPbxproj(filePath: string, version: string, buildNumber: number | undefined): void {
  let content = readFile(filePath);

  content = content.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);

  if (buildNumber !== undefined) {
    content = content.replace(
      /CURRENT_PROJECT_VERSION = [^;]+;/g,
      `CURRENT_PROJECT_VERSION = ${buildNumber};`
    );
  }

  writeFile(filePath, content);
}
