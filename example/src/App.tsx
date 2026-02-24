import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Linking,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  addNotificationStateChangeListener,
  addTokenChangeListener,
  startLiveUpdate,
  stopLiveUpdate,
  updateLiveUpdate,
} from 'react-native-android-live-updates';

export default function App() {
  const [notificationId, setNotificationId] = useState<number | undefined>();
  const [events, setEvents] = useState<string[]>([]);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    Platform.OS !== 'android' ||
      (typeof Platform.Version === 'number' && Platform.Version < 33)
  );

  const isBaklava =
    Platform.OS === 'android' &&
    typeof Platform.Version === 'number' &&
    Platform.Version >= 36;

  const checkNotificationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }
    if (typeof Platform.Version === 'number' && Platform.Version < 33) {
      return true;
    }

    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    setHasNotificationPermission(granted);
    return granted;
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }
    if (typeof Platform.Version === 'number' && Platform.Version < 33) {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Notifications Permission',
        message: 'This example needs access to notifications.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
    setHasNotificationPermission(isGranted);
    return isGranted;
  };

  const openNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Unable to open settings');
    }
  };

  useEffect(() => {
    requestNotificationPermission().catch(() => {
      setHasNotificationPermission(false);
    });

    const tokenSub = addTokenChangeListener((event) => {
      setEvents((previous) =>
        [`token: ${event.token}`, ...previous].slice(0, 20)
      );
    });
    const notificationSub = addNotificationStateChangeListener((event) => {
      setEvents((previous) =>
        [
          `notification ${event.notificationId}: ${event.action}`,
          ...previous,
        ].slice(0, 20)
      );
    });

    return () => {
      tokenSub?.remove();
      notificationSub?.remove();
    };
  }, []);

  const ensureNotificationPermission = async (): Promise<boolean> => {
    const current = await checkNotificationPermission();
    if (current) {
      return true;
    }

    const requested = await requestNotificationPermission();
    if (!requested) {
      setEvents((previous) =>
        ['notification permission denied', ...previous].slice(0, 20)
      );
    }
    return requested;
  };

  const start = async () => {
    const notificationsGranted = await ensureNotificationPermission();
    if (!notificationsGranted) {
      return;
    }

    try {
      const id = startLiveUpdate(
        {
          title: 'Ride in progress',
          text: 'Heading to destination',
          progress: { max: 100, progress: 15 },
        },
        { deepLinkUrl: '/trip/123' }
      );

      if (typeof id === 'number') {
        setNotificationId(id);
      } else {
        setNotificationId(undefined);
        setEvents((previous) =>
          [
            'start failed: notification was not posted (check app/channel notification settings)',
            ...previous,
          ].slice(0, 20)
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown start error';
      setEvents((previous) =>
        [`start error: ${message}`, ...previous].slice(0, 20)
      );
    }
  };

  const update = async () => {
    const notificationsGranted = await ensureNotificationPermission();
    if (!notificationsGranted) {
      return;
    }

    if (!notificationId) {
      return;
    }
    try {
      updateLiveUpdate(notificationId, {
        title: 'Ride in progress',
        text: 'Almost there',
        progress: { max: 100, progress: 85 },
        shortCriticalText: 'ETA',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown update error';
      setEvents((previous) =>
        [`update error: ${message}`, ...previous].slice(0, 20)
      );
    }
  };

  const stop = () => {
    if (!notificationId) {
      return;
    }
    stopLiveUpdate(notificationId);
    setNotificationId(undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Android Live Updates Example</Text>
        <Text style={styles.subtitle}>
          Platform: {Platform.OS} {String(Platform.Version)}
        </Text>
        <Text style={styles.subtitle}>
          Notification permission:{' '}
          {hasNotificationPermission ? 'granted' : 'not granted'}
        </Text>
        {isBaklava && (
          <Text style={styles.subtitle}>
            Promoted permission is controlled in Android notification settings.
          </Text>
        )}
        <Text style={styles.subtitle}>
          Active notificationId: {notificationId ?? 'none'}
        </Text>
        <View style={styles.buttons}>
          <Button
            title="Request Notification Permission"
            onPress={requestNotificationPermission}
          />
          {isBaklava && (
            <Button
              title="Open Notification Settings"
              onPress={openNotificationSettings}
            />
          )}
          <Button title="Start Live Update" onPress={start} />
          <Button title="Update Live Update" onPress={update} />
          <Button title="Stop Live Update" onPress={stop} />
        </View>
        <Text style={styles.eventsTitle}>Recent events</Text>
        {events.map((item, index) => (
          <Text key={`${index}-${item}`} style={styles.eventItem}>
            {item}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
  },
  buttons: {
    gap: 8,
    marginTop: 8,
  },
  eventsTitle: {
    marginTop: 12,
    fontWeight: '600',
  },
  eventItem: {
    fontSize: 12,
  },
});
