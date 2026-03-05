# Migration Record: expo-live-updates → react-native-android-live-updates

This document records the port of
[`expo-live-updates`](https://github.com/software-mansion-labs/expo-live-updates)
to a bare React Native TurboModule.
Use this as a reference when merging future upstream changes.

---

## Upstream Snapshot

| Field | Value |
|-------|-------|
| Repository | https://github.com/software-mansion-labs/expo-live-updates.git |
| Snapshot commit | `e8e58c1` — Update installation instructions in README.md (#60) |
| Package version | `0.0.0` (pre-release) |
| Snapshot path | `.ref/expo-live-updates/` |

Initial port commit in this repo: `6368f39` — feat: migrate expo-live-updates core to bare RN TurboModule

---

## File Mapping

### Copied as-is (package name only)

| Upstream | This repo | Notes |
|----------|-----------|-------|
| `expo/modules/liveupdates/FirebaseService.kt` | `com/androidliveupdates/liveupdates/FirebaseService.kt` | Identical |
| `expo/modules/liveupdates/IdGenerator.kt` | `com/androidliveupdates/liveupdates/IdGenerator.kt` | Identical |
| `expo/modules/liveupdates/NotificationDismissedReceiver.kt` | `com/androidliveupdates/liveupdates/NotificationDismissedReceiver.kt` | Identical |
| `expo/modules/liveupdates/NotificationStateEventEmitter.kt` | `com/androidliveupdates/liveupdates/NotificationStateEventEmitter.kt` | Identical |
| `expo/modules/liveupdates/TokenChangeHandler.kt` | `com/androidliveupdates/liveupdates/TokenChangeHandler.kt` | Identical |

### Adapted (small changes required)

| Upstream | This repo | Changes |
|----------|-----------|---------|
| `expo/modules/liveupdates/LiveUpdatesTypes.kt` | `com/androidliveupdates/liveupdates/LiveUpdatesTypes.kt` | Removed `expo.modules.kotlin.records.{Field,Record}`; converted to plain data classes |
| `expo/modules/liveupdates/LiveUpdatesManager.kt` | `com/androidliveupdates/liveupdates/LiveUpdatesManager.kt` | Deep-link warning message points to `AndroidManifest.xml` metadata instead of Expo config plugin |
| `expo/modules/liveupdates/LiveUpdatesHelpers.kt` | `com/androidliveupdates/liveupdates/LiveUpdatesHelpers.kt` | Updated error messages to reference `AndroidManifest.xml` instead of Expo plugin config |

### Fully rewritten

| Upstream | This repo | Changes |
|----------|-----------|---------|
| `ExpoLiveUpdatesModule.kt` (Expo Module API) | `AndroidLiveUpdatesModule.kt` | Rewritten as RN TurboModule (`NativeAndroidLiveUpdatesSpec`) |
| — | `AndroidLiveUpdatesPackage.kt` | New: RN package registration |
| `src/ExpoLiveUpdatesModule.ts` | `src/NativeAndroidLiveUpdates.ts` | New: TurboModule spec interface |
| `src/ExpoLiveUpdatesModule.ts` | `src/ExpoLiveUpdatesModule.ts` | Simplified to a native module re-export |
| `src/index.ts` | `src/index.ts` | Replaced `expo-modules-core` with `NativeEventEmitter` / `TurboModuleRegistry` |

---

## Intentional Divergences from Upstream

**Do not overwrite these when syncing with upstream.**

### 1. `AndroidLiveUpdatesModule` — `removeListeners` behaviour

The upstream `ExpoLiveUpdatesModule` sets `NotificationStateEventEmitter.sendEvent` in `OnCreate`
and never clears it. This port keeps the same effective behavior: `removeListeners` is a no-op for
native emitter teardown, and emitters stay active after initialization.

### 2. `LiveUpdatesHelpers` / `LiveUpdatesManager` — error messages

Upstream error messages reference the Expo config plugin (`withChannelConfig`, `app.config.ts`).
This port changes those messages to instruct users to add `<meta-data>` entries to
`AndroidManifest.xml` instead.

**The metadata key names themselves (`expo.modules.liveupdates.channelId`, etc.) are intentionally
kept identical to upstream** to preserve compatibility with projects that may migrate between
expo-live-updates and this library.

### 3. `startLiveUpdate` return value

Upstream JS: can return `null` directly when notification creation fails.
This port: native returns `-1`; JS converts it to `undefined` via `notificationId > 0` check.

---

## How to Sync with Upstream

1. Pull the latest commits into the reference snapshot:
   ```bash
   git -C .ref/expo-live-updates pull origin main
   ```
2. Use the **File Mapping** table above to identify which upstream files changed.
3. For "Copied as-is" files, apply changes with only the package name substitution.
4. For each item in **Intentional Divergences**, check whether upstream now handles it equivalently
   before deciding whether to keep or drop the divergence.
5. Update the **Upstream Snapshot** commit hash and date in this document.
