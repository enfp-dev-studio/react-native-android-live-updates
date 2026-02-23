# react-native-android-live-updates

Android Live Updates for bare React Native, migrated from expo-live-updates.

## Installation

```sh
npm install react-native-android-live-updates
```

## Usage

```ts
import {
  addNotificationStateChangeListener,
  addTokenChangeListener,
  startLiveUpdate,
  stopLiveUpdate,
  updateLiveUpdate,
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

const notificationSub = addNotificationStateChangeListener(event => {
  console.log(event.notificationId, event.action);
});

const tokenSub = addTokenChangeListener(event => {
  console.log(event.token);
});

if (notificationId) {
  stopLiveUpdate(notificationId);
}
notificationSub?.remove();
tokenSub?.remove();
```

## Android setup (required)

Add these permissions in your app `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.POST_PROMOTED_NOTIFICATIONS" />
```

Add metadata inside your `<application>` tag:

```xml
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

Register receiver inside your `<application>` tag:

```xml
<receiver
  android:name="com.androidliveupdates.liveupdates.NotificationDismissedReceiver"
  android:enabled="true"
  android:exported="false" />
```

If you use Firebase Cloud Messaging, also register service:

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

- Android only.
- iOS autolinking is disabled via `react-native.config.js`.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
