import { useEffect, useState } from 'react';
import {
  Button,
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

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }
    if (typeof Platform.Version === 'number' && Platform.Version < 33) {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Notification Permission',
        message:
          'Live Updates requires notification permission to show and update notifications.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );

    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    setHasNotificationPermission(granted);
    return granted;
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

  const start = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      setEvents((previous) =>
        ['notification permission denied', ...previous].slice(0, 20)
      );
      return;
    }

    const id = startLiveUpdate(
      {
        title: 'Ride in progress',
        text: 'Heading to destination',
        progress: { max: 100, progress: 15 },
      },
      { deepLinkUrl: '/trip/123' }
    );
    setNotificationId(typeof id === 'number' ? id : undefined);
  };

  const update = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      setEvents((previous) =>
        ['notification permission denied', ...previous].slice(0, 20)
      );
      return;
    }

    if (!notificationId) {
      return;
    }
    updateLiveUpdate(notificationId, {
      title: 'Ride in progress',
      text: 'Almost there',
      progress: { max: 100, progress: 85 },
      shortCriticalText: 'ETA',
    });
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
        <Text style={styles.subtitle}>Platform: {Platform.OS}</Text>
        <Text style={styles.subtitle}>
          Notification permission:{' '}
          {hasNotificationPermission ? 'granted' : 'not granted'}
        </Text>
        <Text style={styles.subtitle}>
          Active notificationId: {notificationId ?? 'none'}
        </Text>
        <View style={styles.buttons}>
          <Button
            title="Request Notification Permission"
            onPress={requestNotificationPermission}
          />
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
