import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { syncAndroid } from '../android.js';

function tmp(name: string): string {
  return join(tmpdir(), `changeset-mobile-${name}-${process.pid}`);
}

const GROOVY_GRADLE = `
android {
    defaultConfig {
        applicationId "com.example.app"
        versionCode 42
        versionName "1.0.0"
        minSdkVersion 21
    }
}
`;

const KTS_GRADLE = `
android {
    defaultConfig {
        applicationId = "com.example.app"
        versionCode = 42
        versionName = "1.0.0"
        minSdk = 21
    }
}
`;

let gradlePath: string;

afterEach(() => {
  try { unlinkSync(gradlePath); } catch { /* already gone */ }
});

describe('Groovy DSL (build.gradle)', () => {
  beforeEach(() => {
    gradlePath = tmp('build.gradle');
    writeFileSync(gradlePath, GROOVY_GRADLE);
  });

  it('updates versionName', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath }, '2.1.0');
    expect(readFileSync(gradlePath, 'utf-8')).toContain('versionName "2.1.0"');
  });

  it('does not change versionCode when versionCode is omitted', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath }, '2.1.0');
    expect(readFileSync(gradlePath, 'utf-8')).toContain('versionCode 42');
  });

  it('auto-increments versionCode', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath, versionCode: 'auto' }, '2.1.0');
    expect(readFileSync(gradlePath, 'utf-8')).toContain('versionCode 43');
  });

  it('sets a fixed versionCode', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath, versionCode: 100 }, '2.1.0');
    expect(readFileSync(gradlePath, 'utf-8')).toContain('versionCode 100');
  });

  it('does not alter unrelated fields', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath, versionCode: 'auto' }, '2.1.0');
    const content = readFileSync(gradlePath, 'utf-8');
    expect(content).toContain('applicationId "com.example.app"');
    expect(content).toContain('minSdkVersion 21');
  });
});

describe('Kotlin DSL (build.gradle.kts)', () => {
  beforeEach(() => {
    gradlePath = tmp('build.gradle.kts');
    writeFileSync(gradlePath, KTS_GRADLE);
  });

  it('updates versionName', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath }, '2.1.0');
    expect(readFileSync(gradlePath, 'utf-8')).toContain('versionName = "2.1.0"');
  });

  it('does not change versionCode when versionCode is omitted', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath }, '2.1.0');
    expect(readFileSync(gradlePath, 'utf-8')).toContain('versionCode = 42');
  });

  it('auto-increments versionCode', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath, versionCode: 'auto' }, '2.1.0');
    expect(readFileSync(gradlePath, 'utf-8')).toContain('versionCode = 43');
  });

  it('sets a fixed versionCode', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath, versionCode: 100 }, '2.1.0');
    expect(readFileSync(gradlePath, 'utf-8')).toContain('versionCode = 100');
  });

  it('does not alter unrelated fields', () => {
    syncAndroid({ platform: 'android', buildGradle: gradlePath, versionCode: 'auto' }, '2.1.0');
    const content = readFileSync(gradlePath, 'utf-8');
    expect(content).toContain('applicationId = "com.example.app"');
    expect(content).toContain('minSdk = 21');
  });
});
