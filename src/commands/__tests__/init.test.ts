import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { setPackageVersion } from '../init.js';

const PKG_PATH = resolve(process.cwd(), 'package.json');
let originalPkg: string;

beforeEach(() => {
  originalPkg = readFileSync(PKG_PATH, 'utf-8');
  writeFileSync(PKG_PATH, JSON.stringify({ name: 'test-app', version: '0.0.1' }, null, 2));
});

afterEach(() => {
  writeFileSync(PKG_PATH, originalPkg);
});

describe('setPackageVersion', () => {
  it('sets the version in package.json', () => {
    setPackageVersion('1.2.3');
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8')) as { version: string };
    expect(pkg.version).toBe('1.2.3');
  });

  it('preserves other package.json fields', () => {
    setPackageVersion('2.0.0');
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8')) as { name: string; version: string };
    expect(pkg.name).toBe('test-app');
    expect(pkg.version).toBe('2.0.0');
  });

  it('overwrites an existing version', () => {
    setPackageVersion('1.0.0');
    setPackageVersion('3.0.0');
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8')) as { version: string };
    expect(pkg.version).toBe('3.0.0');
  });
});
