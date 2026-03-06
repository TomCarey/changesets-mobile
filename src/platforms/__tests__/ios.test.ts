import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { syncIos } from '../ios.js';

function tmp(name: string): string {
  return join(tmpdir(), `changeset-mobile-${name}-${process.pid}`);
}

const INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>CFBundleShortVersionString</key>
\t<string>1.0.0</string>
\t<key>CFBundleVersion</key>
\t<string>42</string>
</dict>
</plist>
`;

// Simulates multiple build configurations (Debug + Release)
const PBXPROJ = `
\t\t\tMARKETING_VERSION = 1.0.0;
\t\t\tCURRENT_PROJECT_VERSION = 42;
/* Debug */
\t\t\tMARKETING_VERSION = 1.0.0;
\t\t\tCURRENT_PROJECT_VERSION = 42;
/* Release */
`;

let plistPath: string;
let pbxprojPath: string;

beforeEach(() => {
  plistPath = tmp('Info.plist');
  pbxprojPath = tmp('project.pbxproj');
  writeFileSync(plistPath, INFO_PLIST);
  writeFileSync(pbxprojPath, PBXPROJ);
});

afterEach(() => {
  for (const f of [plistPath, pbxprojPath]) {
    try { unlinkSync(f); } catch { /* already gone */ }
  }
});

describe('Info.plist', () => {
  it('updates CFBundleShortVersionString', () => {
    syncIos({ platform: 'ios', infoPlist: plistPath, pbxproj: pbxprojPath }, '2.1.0');
    const content = readFileSync(plistPath, 'utf-8');
    expect(content).toMatch(/<key>CFBundleShortVersionString<\/key>\s*<string>2\.1\.0<\/string>/);
  });

  it('does not change CFBundleVersion when buildNumber is omitted', () => {
    syncIos({ platform: 'ios', infoPlist: plistPath, pbxproj: pbxprojPath }, '2.1.0');
    const content = readFileSync(plistPath, 'utf-8');
    expect(content).toMatch(/<key>CFBundleVersion<\/key>\s*<string>42<\/string>/);
  });

  it('auto-increments CFBundleVersion', () => {
    syncIos({ platform: 'ios', infoPlist: plistPath, pbxproj: pbxprojPath, buildNumber: 'auto' }, '2.1.0');
    const content = readFileSync(plistPath, 'utf-8');
    expect(content).toMatch(/<key>CFBundleVersion<\/key>\s*<string>43<\/string>/);
  });

  it('sets a fixed CFBundleVersion', () => {
    syncIos({ platform: 'ios', infoPlist: plistPath, pbxproj: pbxprojPath, buildNumber: 100 }, '2.1.0');
    const content = readFileSync(plistPath, 'utf-8');
    expect(content).toMatch(/<key>CFBundleVersion<\/key>\s*<string>100<\/string>/);
  });
});

describe('project.pbxproj', () => {
  it('updates MARKETING_VERSION in all build configurations', () => {
    syncIos({ platform: 'ios', infoPlist: plistPath, pbxproj: pbxprojPath }, '2.1.0');
    const content = readFileSync(pbxprojPath, 'utf-8');
    const matches = content.match(/MARKETING_VERSION = 2\.1\.0;/g);
    expect(matches).toHaveLength(2);
  });

  it('does not change CURRENT_PROJECT_VERSION when buildNumber is omitted', () => {
    syncIos({ platform: 'ios', infoPlist: plistPath, pbxproj: pbxprojPath }, '2.1.0');
    const content = readFileSync(pbxprojPath, 'utf-8');
    const matches = content.match(/CURRENT_PROJECT_VERSION = 42;/g);
    expect(matches).toHaveLength(2);
  });

  it('auto-increments CURRENT_PROJECT_VERSION in all build configurations', () => {
    syncIos({ platform: 'ios', infoPlist: plistPath, pbxproj: pbxprojPath, buildNumber: 'auto' }, '2.1.0');
    const content = readFileSync(pbxprojPath, 'utf-8');
    const matches = content.match(/CURRENT_PROJECT_VERSION = 43;/g);
    expect(matches).toHaveLength(2);
  });

  it('sets a fixed CURRENT_PROJECT_VERSION in all build configurations', () => {
    syncIos({ platform: 'ios', infoPlist: plistPath, pbxproj: pbxprojPath, buildNumber: 100 }, '2.1.0');
    const content = readFileSync(pbxprojPath, 'utf-8');
    const matches = content.match(/CURRENT_PROJECT_VERSION = 100;/g);
    expect(matches).toHaveLength(2);
  });

  it('uses the same incremented build number in both Info.plist and pbxproj', () => {
    syncIos({ platform: 'ios', infoPlist: plistPath, pbxproj: pbxprojPath, buildNumber: 'auto' }, '2.1.0');
    const plist = readFileSync(plistPath, 'utf-8');
    const pbx = readFileSync(pbxprojPath, 'utf-8');
    expect(plist).toMatch(/<key>CFBundleVersion<\/key>\s*<string>43<\/string>/);
    expect(pbx).toMatch(/CURRENT_PROJECT_VERSION = 43;/);
  });
});

// Realistic multi-target pbxproj with two native targets (MyApp + MyAppExtension)
const PBXPROJ_MULTI_TARGET = `
/* Begin PBXNativeTarget section */
		AAAA0001 /* MyApp */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = AAAA0002 /* Build configuration list for PBXNativeTarget "MyApp" */;
		};
		BBBB0001 /* MyAppExtension */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = BBBB0002 /* Build configuration list for PBXNativeTarget "MyAppExtension" */;
		};
/* End PBXNativeTarget section */
/* Begin XCConfigurationList section */
		AAAA0002 /* Build configuration list for PBXNativeTarget "MyApp" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				AAAA0003 /* Debug */,
				AAAA0004 /* Release */,
			);
		};
		BBBB0002 /* Build configuration list for PBXNativeTarget "MyAppExtension" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				BBBB0003 /* Debug */,
				BBBB0004 /* Release */,
			);
		};
/* End XCConfigurationList section */
/* Begin XCBuildConfiguration section */
		AAAA0003 /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				MARKETING_VERSION = 1.0.0;
				CURRENT_PROJECT_VERSION = 42;
			};
			name = Debug;
		};
		AAAA0004 /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				MARKETING_VERSION = 1.0.0;
				CURRENT_PROJECT_VERSION = 42;
			};
			name = Release;
		};
		BBBB0003 /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				MARKETING_VERSION = 1.0.0;
				CURRENT_PROJECT_VERSION = 42;
			};
			name = Debug;
		};
		BBBB0004 /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				MARKETING_VERSION = 1.0.0;
				CURRENT_PROJECT_VERSION = 42;
			};
			name = Release;
		};
/* End XCBuildConfiguration section */
`;

describe('targets filter', () => {
  let multiTargetPath: string;

  beforeEach(() => {
    multiTargetPath = tmp('multi.pbxproj');
    writeFileSync(multiTargetPath, PBXPROJ_MULTI_TARGET);
  });

  afterEach(() => {
    try { unlinkSync(multiTargetPath); } catch { /* already gone */ }
  });

  it('updates all targets when targets is omitted', () => {
    syncIos({ platform: 'ios', pbxproj: multiTargetPath }, '2.0.0');
    const content = readFileSync(multiTargetPath, 'utf-8');
    expect(content.match(/MARKETING_VERSION = 2\.0\.0;/g)).toHaveLength(4);
  });

  it('updates only the specified target', () => {
    syncIos({ platform: 'ios', pbxproj: multiTargetPath, targets: ['MyApp'] }, '2.0.0');
    const content = readFileSync(multiTargetPath, 'utf-8');
    expect(content.match(/MARKETING_VERSION = 2\.0\.0;/g)).toHaveLength(2);
    expect(content.match(/MARKETING_VERSION = 1\.0\.0;/g)).toHaveLength(2);
  });

  it('does not touch the other target when one is specified', () => {
    syncIos({ platform: 'ios', pbxproj: multiTargetPath, targets: ['MyApp'] }, '2.0.0');
    const content = readFileSync(multiTargetPath, 'utf-8');
    // MyAppExtension blocks should be unchanged
    expect(content).toMatch(/BBBB0003[\s\S]*?MARKETING_VERSION = 1\.0\.0;/);
    expect(content).toMatch(/BBBB0004[\s\S]*?MARKETING_VERSION = 1\.0\.0;/);
  });

  it('updates multiple specified targets', () => {
    syncIos({ platform: 'ios', pbxproj: multiTargetPath, targets: ['MyApp', 'MyAppExtension'] }, '2.0.0');
    const content = readFileSync(multiTargetPath, 'utf-8');
    expect(content.match(/MARKETING_VERSION = 2\.0\.0;/g)).toHaveLength(4);
  });

  it('auto-increments CURRENT_PROJECT_VERSION only within specified target blocks', () => {
    syncIos({ platform: 'ios', pbxproj: multiTargetPath, targets: ['MyApp'], buildNumber: 'auto' }, '2.0.0');
    const content = readFileSync(multiTargetPath, 'utf-8');
    expect(content.match(/CURRENT_PROJECT_VERSION = 43;/g)).toHaveLength(2);
    expect(content.match(/CURRENT_PROJECT_VERSION = 42;/g)).toHaveLength(2);
  });
});

describe('pbxproj-only (no infoPlist)', () => {
  it('updates MARKETING_VERSION without an infoPlist', () => {
    syncIos({ platform: 'ios', pbxproj: pbxprojPath }, '2.1.0');
    const content = readFileSync(pbxprojPath, 'utf-8');
    const matches = content.match(/MARKETING_VERSION = 2\.1\.0;/g);
    expect(matches).toHaveLength(2);
  });

  it('does not touch Info.plist when infoPlist is omitted', () => {
    syncIos({ platform: 'ios', pbxproj: pbxprojPath }, '2.1.0');
    const content = readFileSync(plistPath, 'utf-8');
    expect(content).toMatch(/<string>1\.0\.0<\/string>/);
  });

  it('auto-increments CURRENT_PROJECT_VERSION from pbxproj when infoPlist is omitted', () => {
    syncIos({ platform: 'ios', pbxproj: pbxprojPath, buildNumber: 'auto' }, '2.1.0');
    const content = readFileSync(pbxprojPath, 'utf-8');
    const matches = content.match(/CURRENT_PROJECT_VERSION = 43;/g);
    expect(matches).toHaveLength(2);
  });
});
