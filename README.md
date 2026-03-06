# changeset-mobile

A CLI that wraps [@changesets/cli](https://github.com/changesets/changesets) to support iOS and Android native version management. After `changeset version` bumps your `package.json`, this tool syncs the new version into your iOS and Android native files automatically.

## What it updates

| Platform | File | Fields |
|---|---|---|
| iOS | `Info.plist` | `CFBundleShortVersionString`, `CFBundleVersion` |
| iOS | `project.pbxproj` | `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION` |
| Android | `build.gradle` / `build.gradle.kts` | `versionName`, `versionCode` |

Both Groovy DSL and Kotlin DSL are supported for Android.

## Installation

```bash
npm install --save-dev changeset-mobile
# or globally
npm install -g changeset-mobile
```

## Setup

If you haven't already, initialise changesets in your repo:

```bash
npx changeset init
```

Then run the interactive setup for this tool:

```bash
npx changeset-mobile init
```

This creates a `changeset-mobile.config.json` file in your project root.

## Configuration

`changeset-mobile.config.json`:

```json
{
  "platforms": [
    {
      "platform": "ios",
      "infoPlist": "ios/App/Info.plist",
      "pbxproj": "ios/App.xcodeproj/project.pbxproj",
      "buildNumber": "auto"
    },
    {
      "platform": "android",
      "buildGradle": "android/app/build.gradle.kts",
      "versionCode": "auto"
    }
  ]
}
```

Config files support `// line comments` for readability.

### Field reference

| Field | Platform | Required | Description |
|---|---|---|---|
| `platform` | both | yes | `"ios"` or `"android"` |
| `infoPlist` | iOS | yes | Path to `Info.plist` |
| `pbxproj` | iOS | yes | Path to `project.pbxproj` |
| `buildNumber` | iOS | no | `"auto"` to increment, a fixed integer, or omit to skip |
| `buildGradle` | Android | yes | Path to `build.gradle` or `build.gradle.kts` |
| `versionCode` | Android | no | `"auto"` to increment, a fixed integer, or omit to skip |

## Usage

### Authoring a changeset (on each PR)

Use the standard changesets CLI to describe what changed:

```bash
npx changeset add
```

### Releasing (on main / in CI)

```bash
npx changeset-mobile version
```

This runs `changeset version` (which bumps `package.json` and updates changelogs), then reads the new version and writes it into all configured native files.

Commit and tag the result:

```bash
git add -A && git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z && git push --follow-tags
```

## Typical workflow

```bash
# One-time repo setup
npx changeset init
npx changeset-mobile init

# On each PR — describe the change type (patch / minor / major)
npx changeset add

# On release
npx changeset-mobile version
git add -A && git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z && git push --follow-tags
```

## How versioning works

`package.json` is the source of truth for the version — changesets manages it natively. This tool reads the post-bump version from `package.json` and writes it into the configured native files.

When `buildNumber` / `versionCode` is set to `"auto"`, the current value is read from the file and incremented by 1. The same computed value is applied to both `Info.plist` and `project.pbxproj` so they stay in sync.

## Dependencies

- [`@changesets/cli`](https://github.com/changesets/changesets) — core versioning and changelog engine
- [`execa`](https://github.com/sindresorhus/execa) — spawns the changeset CLI as a subprocess
