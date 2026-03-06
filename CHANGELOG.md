# changesets-mobile

## 0.1.0

### Minor Changes

- 0daa166: Add `targets` array to iOS config. When specified, only the named Xcode targets have their `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` updated in `project.pbxproj`. Omitting `targets` preserves the existing behaviour of updating all targets.

### Patch Changes

- 8a652f2: `init` now auto-discovers `.xcodeproj` and `Info.plist` in the current directory and suggests them as defaults during the iOS setup prompts. `Info.plist` can be left blank to skip it (useful when the project already uses `MARKETING_VERSION`).
- bff24b3: Make `infoPlist` optional in iOS config. Projects that use `MARKETING_VERSION` from `project.pbxproj` can now omit the `infoPlist` path. When `buildNumber: "auto"` is set without an `infoPlist`, the current build number is read from `CURRENT_PROJECT_VERSION` in the pbxproj instead.
