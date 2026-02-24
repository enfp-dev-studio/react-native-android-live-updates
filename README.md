# react-native-android-live-updates

Android [Live Updates](https://developer.android.com/develop/ui/views/notifications/live-updates) for bare React Native.

This is a bare React Native port of [expo-live-updates](https://github.com/software-mansion-labs/expo-live-updates) by [Software Mansion Labs](https://github.com/software-mansion-labs). It tracks the upstream library and exposes the same API as a React Native TurboModule, so projects not using the Expo managed workflow can use Live Updates on Android 16+.

> This project is not affiliated with Expo or Software Mansion. All core notification logic originates from expo-live-updates.

## Installation

```sh
npm install react-native-android-live-updates
```

## Usage

```ts
import {
  startLiveUpdate,
  updateLiveUpdate,
  stopLiveUpdate,
  addNotificationStateChangeListener,
  addTokenChangeListener,
} from 'react-native-android-live-updates';

const notificationId = startLiveUpdate(
  {
    title: 'Order in progress',
    text: 'Preparing your order',
    progress: { max: 100, progress: 25 },
  },
  { deepLinkUrl: '/orders/123' }
);

if (notificationId) {
  updateLiveUpdate(notificationId, {
    title: 'Order in progress',
    text: 'Almost ready',
    progress: { max: 100, progress: 80 },
  });
}

const notificationSub = addNotificationStateChangeListener((event) => {
  console.log(event.notificationId, event.action);
});

const tokenSub = addTokenChangeListener((event) => {
  console.log(event.token);
});

if (notificationId) {
  stopLiveUpdate(notificationId);
}
notificationSub?.remove();
tokenSub?.remove();
```

## Android Setup

Add permissions to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.POST_PROMOTED_NOTIFICATIONS" />
```

Add metadata inside the `<application>` tag:

```xml
<!-- Required -->
<meta-data
  android:name="expo.modules.liveupdates.channelId"
  android:value="LiveUpdatesServiceChannelId" />
<meta-data
  android:name="expo.modules.liveupdates.channelName"
  android:value="Live Updates Service Channel Name" />

<!-- Optional: required only for deepLinkUrl support -->
<meta-data
  android:name="expo.modules.scheme"
  android:value="your-app-scheme" />
```

> The `expo.modules.*` key names are intentionally kept identical to upstream for compatibility.

Register the broadcast receiver inside the `<application>` tag:

```xml
<receiver
  android:name="com.androidliveupdates.liveupdates.NotificationDismissedReceiver"
  android:enabled="true"
  android:exported="false" />
```

If you use Firebase Cloud Messaging, also register the service:

```xml
<service
  android:name="com.androidliveupdates.liveupdates.FirebaseService"
  android:exported="false">
  <intent-filter>
    <action android:name="com.google.firebase.MESSAGING_EVENT" />
  </intent-filter>
</service>
```

If you use deep links, add a matching `VIEW` intent filter for your activity.

## Platform

Android 16 (API 36) and above. iOS autolinking is disabled via `react-native.config.js`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
Portions of this library are derived from [expo-live-updates](https://github.com/software-mansion-labs/expo-live-updates) by Software Mansion Labs.
