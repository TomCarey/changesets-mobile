# changesets-mobile

A CLI that wraps [@changesets/cli](https://github.com/changesets/changesets) to support iOS and Android native version management. Instead of only bumping `package.json`, it syncs the new version into your iOS (`Info.plist` + `project.pbxproj`) and Android (`build.gradle` / `build.gradle.kts`) files automatically.

## Installation

```bash
npm install --save-dev changesets-mobile
```

## Setup

```bash
# If you haven't already, initialise changesets in your repo
npx changeset init

# Then set up changesets-mobile
npx changeset-mobile init --version 1.0.0
```

`init` creates a `changeset-mobile.config.json` in your project root and optionally sets the initial version in `package.json`.

## Commands

```bash
changeset-mobile init                    # Interactive setup — creates changeset-mobile.config.json
changeset-mobile init --version 1.0.0   # Same, but also sets the initial version in package.json
changeset-mobile version                 # Runs "changeset version" then syncs into native files
```

For authoring changesets (describing what changed in a PR), use the standard CLI directly:

```bash
npx changeset add
```

## Configuration

Create `changeset-mobile.config.json` in your project root (the `init` command does this for you):

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

| Field         | Platform | Required | Description |
|---------------|----------|----------|-------------|
| `platform`    | both     | ✅       | `"ios"` or `"android"` |
| `infoPlist`   | iOS      | ✅       | Path to `Info.plist` |
| `pbxproj`     | iOS      | ✅       | Path to `project.pbxproj` |
| `buildNumber` | iOS      | ❌       | `"auto"` to increment, integer to fix, omit to skip |
| `buildGradle` | Android  | ✅       | Path to `build.gradle` or `build.gradle.kts` |
| `versionCode` | Android  | ❌       | `"auto"` to increment, integer to fix, omit to skip |

## How it works

1. `package.json` is the **source of truth** for the version — changesets manages it natively.
2. After `changeset version` runs, this tool reads the new version from `package.json` and writes it into the configured native files.
3. Build number / versionCode can be auto-incremented or set to a fixed value via config.

### iOS

- **Info.plist** — updates `CFBundleShortVersionString` (version) and `CFBundleVersion` (build number)
- **project.pbxproj** — updates `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` across all build configurations

### Android

- **build.gradle / build.gradle.kts** — updates `versionName` and `versionCode`
- Both Groovy DSL (`.gradle`) and Kotlin DSL (`.kts`) syntax are supported

## Typical workflow

```bash
# On each PR — describe the change type (patch / minor / major)
npx changeset add

# On release (main branch / CI)
npx changeset-mobile version
git add -A && git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z && git push --follow-tags
```

## License

MIT
