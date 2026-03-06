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
  syncPbxproj(config.pbxproj, version, buildNumber, config.targets);

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

// Returns the [start, end] character range of the block DEFINED by the given UUID.
// Matches the block definition pattern (UUID /* comment */ = { ... }) rather than
// a bare reference, so UUID references inside other blocks are skipped.
// Uses brace counting so nested blocks (e.g. buildSettings = { ... }) are handled correctly.
function getBlockRange(content: string, uuid: string, fromIndex = 0): [number, number] | null {
  const defMatch = content.slice(fromIndex).match(
    new RegExp(`${uuid}\\s*(?:/\\*[^*]*\\*/\\s*)?=\\s*\\{`)
  );
  if (!defMatch || defMatch.index === undefined) return null;
  const start = fromIndex + defMatch.index;
  let depth = 0;
  let entered = false;
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') { depth++; entered = true; }
    if (content[i] === '}') { depth--; }
    if (entered && depth === 0) return [start, i + 1];
  }
  return null;
}

// Resolves target names to the UUIDs of their XCBuildConfiguration blocks.
// Finds each target's XCConfigurationList directly via Xcode's generated comment format,
// then extracts the build config UUIDs from its buildConfigurations array.
function getConfigUuidsForTargets(content: string, targetNames: string[]): Set<string> {
  const uuids = new Set<string>();
  for (const name of targetNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Xcode always generates this exact comment on the XCConfigurationList for each native target.
    const listUuidMatch = content.match(
      new RegExp(`([A-F0-9]+) /\\* Build configuration list for PBXNativeTarget "${escaped}" \\*/ = \\{`)
    );
    if (!listUuidMatch || listUuidMatch.index === undefined) continue;
    const listUuid = listUuidMatch[1];
    // Use match.index so getBlockRange finds the definition, not an earlier reference.
    const listBlockRange = getBlockRange(content, listUuid, listUuidMatch.index);
    if (!listBlockRange) continue;
    const listBlock = content.slice(...listBlockRange);
    // Extract only the UUIDs inside the buildConfigurations array.
    const configsMatch = listBlock.match(/buildConfigurations = \(([^)]+)\)/);
    if (!configsMatch) continue;
    const configUuids = configsMatch[1].match(/\b[A-F0-9]{8,}\b/g) ?? [];
    for (const uuid of configUuids) uuids.add(uuid);
  }
  return uuids;
}

function replaceInBlock(content: string, uuid: string, version: string, buildNumber: number | undefined): string {
  const range = getBlockRange(content, uuid);
  if (!range) return content;
  const [start, end] = range;
  let block = content.slice(start, end);
  block = block.replace(/MARKETING_VERSION = [^;]+;/, `MARKETING_VERSION = ${version};`);
  if (buildNumber !== undefined) {
    block = block.replace(/CURRENT_PROJECT_VERSION = [^;]+;/, `CURRENT_PROJECT_VERSION = ${buildNumber};`);
  }
  return content.slice(0, start) + block + content.slice(end);
}

function syncPbxproj(filePath: string, version: string, buildNumber: number | undefined, targets?: string[]): void {
  let content = readFile(filePath);

  if (targets && targets.length > 0) {
    const configUuids = getConfigUuidsForTargets(content, targets);
    for (const uuid of configUuids) {
      content = replaceInBlock(content, uuid, version, buildNumber);
    }
  } else {
    content = content.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
    if (buildNumber !== undefined) {
      content = content.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${buildNumber};`);
    }
  }

  writeFile(filePath, content);
}
