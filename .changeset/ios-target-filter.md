---
"changesets-mobile": minor
---

Add `targets` array to iOS config. When specified, only the named Xcode targets have their `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` updated in `project.pbxproj`. Omitting `targets` preserves the existing behaviour of updating all targets.
