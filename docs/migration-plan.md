# react-native-android-live-updates migration plan

## Goal

- Keep upstream `expo-live-updates` structure as close as possible.
- Remove Expo runtime dependency.
- Keep a thin adapter layer so upstream updates can be cherry-picked with minimal conflicts.

## Step 1: Expo adapter surface (functions to implement)

These are the Expo-coupled functions we must replace in bare React Native:

### JS public API

- `startLiveUpdate(state, config?) -> number | undefined`
- `stopLiveUpdate(notificationId) -> void`
- `updateLiveUpdate(notificationId, state, config?) -> void`
- `addTokenChangeListener(listener) -> EventSubscription`
- `addNotificationStateChangeListener(listener) -> EventSubscription`

### Native module methods (TurboModule)

- `startLiveUpdate(state: LiveUpdateState, config?: LiveUpdateConfig): number | null`
- `stopLiveUpdate(notificationId: number): void`
- `updateLiveUpdate(notificationId: number, state: LiveUpdateState, config?: LiveUpdateConfig): void`
- `addListener(eventName: string): void`
- `removeListeners(count: number): void`

### Runtime event contract

- Event name: `onTokenChange` payload: `{ token: string }`
- Event name: `onNotificationStateChange` payload:
  - `{ notificationId: number, action: 'dismissed' | 'updated' | 'started' | 'stopped' | 'clicked', timestamp: number }`

### Expo config-plugin replacements (manual integration)

Since bare RN has no Expo config plugin, we must document/manualize:

- AndroidManifest `<meta-data>`:
  - `expo.modules.liveupdates.channelId`
  - `expo.modules.liveupdates.channelName`
  - `expo.modules.scheme` (optional, for deep links)
- AndroidManifest registration:
  - `FirebaseService` (`com.google.firebase.MESSAGING_EVENT`)
  - `NotificationDismissedReceiver`
- app-level permissions:
  - `android.permission.POST_NOTIFICATIONS`
  - `android.permission.POST_PROMOTED_NOTIFICATIONS`

## Step 2: What can be migrated as-is

## Almost 그대로 복사 가능

- `LiveUpdatesManager.kt`
- `FirebaseService.kt`
- `IdGenerator.kt`
- `NotificationDismissedReceiver.kt`

## Small adapter changes required

- `TokenChangeHandler.kt`
  - Replace Expo callback signature `((String, Bundle) -> Unit)?`
  - Use RN emitter bridge callback type.
- `NotificationStateEventEmitter.kt`
  - Same callback signature replacement as above.
- `LiveUpdatesHelpers.kt`
  - Keep metadata keys identical for upstream compatibility.
  - Update user-facing error strings from Expo plugin wording to bare RN wording.

## Needs rewrite (Expo Kotlin Records/Module API)

- `ExpoLiveUpdatesModule.kt` -> rewrite as RN TurboModule implementation.
- `LiveUpdatesTypes.kt` -> remove `expo.modules.kotlin.records.*` usage.
  - Keep field names compatible with upstream JS API.

## Step 3: Preserve upstream-friendly folder strategy

- Keep upstream-like Kotlin file boundaries (one concern per file).
- Keep function names and data keys the same where possible.
- Limit bare-specific code to:
  - React Native bridge module
  - manifest/setup documentation
  - event emitter plumbing

