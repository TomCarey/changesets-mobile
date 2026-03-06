---
"changesets-mobile": patch
---

Make `infoPlist` optional in iOS config. Projects that use `MARKETING_VERSION` from `project.pbxproj` can now omit the `infoPlist` path. When `buildNumber: "auto"` is set without an `infoPlist`, the current build number is read from `CURRENT_PROJECT_VERSION` in the pbxproj instead.
