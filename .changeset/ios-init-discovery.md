---
"changesets-mobile": patch
---

`init` now auto-discovers `.xcodeproj` and `Info.plist` in the current directory and suggests them as defaults during the iOS setup prompts. `Info.plist` can be left blank to skip it (useful when the project already uses `MARKETING_VERSION`).
