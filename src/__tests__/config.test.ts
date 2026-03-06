import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// loadConfig resolves relative to cwd, so we write to cwd and restore afterwards
const CONFIG_PATH = join(process.cwd(), 'changeset-mobile.config.json');

function writeConfig(content: string): void {
  writeFileSync(CONFIG_PATH, content, 'utf-8');
}

afterEach(() => {
  try { unlinkSync(CONFIG_PATH); } catch { /* file may not exist */ }
});

// Re-import after each write so the module isn't cached with stale state
async function loadConfig() {
  const { loadConfig } = await import('../config.js');
  return loadConfig();
}

describe('loadConfig', () => {
  it('parses a valid iOS config', async () => {
    writeConfig(JSON.stringify({
      platforms: [{ platform: 'ios', infoPlist: 'ios/Info.plist', pbxproj: 'ios/App.xcodeproj/project.pbxproj' }],
    }));
    const config = await loadConfig();
    expect(config.platforms).toHaveLength(1);
    expect(config.platforms[0].platform).toBe('ios');
  });

  it('parses a valid Android config', async () => {
    writeConfig(JSON.stringify({
      platforms: [{ platform: 'android', buildGradle: 'android/app/build.gradle' }],
    }));
    const config = await loadConfig();
    expect(config.platforms[0].platform).toBe('android');
  });

  it('parses a config with both platforms', async () => {
    writeConfig(JSON.stringify({
      platforms: [
        { platform: 'ios', infoPlist: 'ios/Info.plist', pbxproj: 'ios/App.xcodeproj/project.pbxproj' },
        { platform: 'android', buildGradle: 'android/app/build.gradle' },
      ],
    }));
    const config = await loadConfig();
    expect(config.platforms).toHaveLength(2);
  });

  it('strips line comments before parsing', async () => {
    writeConfig(`{
      // this is a comment
      "platforms": [
        // another comment
        { "platform": "android", "buildGradle": "android/app/build.gradle" }
      ]
    }`);
    const config = await loadConfig();
    expect(config.platforms).toHaveLength(1);
  });

  it('throws when the config file is missing', async () => {
    // ensure file does not exist
    try { unlinkSync(CONFIG_PATH); } catch { /* ok */ }
    await expect(loadConfig()).rejects.toThrow('changeset-mobile.config.json not found');
  });

  it('throws on invalid JSON', async () => {
    writeConfig('{ not valid json }');
    await expect(loadConfig()).rejects.toThrow('Failed to parse');
  });

  it('throws when platforms is missing', async () => {
    writeConfig(JSON.stringify({}));
    await expect(loadConfig()).rejects.toThrow('"platforms" array');
  });

  it('throws when iOS config is missing infoPlist', async () => {
    writeConfig(JSON.stringify({
      platforms: [{ platform: 'ios', pbxproj: 'ios/App.xcodeproj/project.pbxproj' }],
    }));
    await expect(loadConfig()).rejects.toThrow('"infoPlist"');
  });

  it('throws when iOS config is missing pbxproj', async () => {
    writeConfig(JSON.stringify({
      platforms: [{ platform: 'ios', infoPlist: 'ios/Info.plist' }],
    }));
    await expect(loadConfig()).rejects.toThrow('"pbxproj"');
  });

  it('throws when Android config is missing buildGradle', async () => {
    writeConfig(JSON.stringify({
      platforms: [{ platform: 'android' }],
    }));
    await expect(loadConfig()).rejects.toThrow('"buildGradle"');
  });

  it('throws on an unknown platform', async () => {
    writeConfig(JSON.stringify({
      platforms: [{ platform: 'windows' }],
    }));
    await expect(loadConfig()).rejects.toThrow('Unknown platform');
  });
});
