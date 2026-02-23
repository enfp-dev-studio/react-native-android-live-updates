import {
  NativeEventEmitter,
  Platform,
  type EventSubscription,
} from 'react-native';

import ExpoLiveUpdatesModule from './ExpoLiveUpdatesModule';
import type {
  LiveUpdateConfig,
  LiveUpdateState,
  NotificationStateChangeEvent,
  TokenChangeEvent,
} from './types';

const eventEmitter = new NativeEventEmitter(ExpoLiveUpdatesModule as never);

type Voidable<T> = T | void;

function assertAndroid(name: string): boolean {
  const isAndroid = Platform.OS === 'android';
  if (!isAndroid) {
    // Keep API calls no-op on non-Android to mirror upstream behavior.
    console.error(`${name} is only available on Android`);
    return false;
  }
  return true;
}

export function startLiveUpdate(
  state: LiveUpdateState,
  config?: LiveUpdateConfig
): Voidable<number> {
  if (!assertAndroid('startLiveUpdate')) {
    return;
  }
  const notificationId = ExpoLiveUpdatesModule.startLiveUpdate(state, config);
  return notificationId > 0 ? notificationId : undefined;
}

export function stopLiveUpdate(notificationId: number): void {
  if (!assertAndroid('stopLiveUpdate')) {
    return;
  }
  ExpoLiveUpdatesModule.stopLiveUpdate(notificationId);
}

export function updateLiveUpdate(
  notificationId: number,
  state: LiveUpdateState,
  config?: LiveUpdateConfig
): void {
  if (!assertAndroid('updateLiveUpdate')) {
    return;
  }
  ExpoLiveUpdatesModule.updateLiveUpdate(notificationId, state, config);
}

export function addTokenChangeListener(
  listener: (event: TokenChangeEvent) => void
): Voidable<EventSubscription> {
  if (!assertAndroid('addTokenChangeListener')) {
    return;
  }
  return eventEmitter.addListener('onTokenChange', (event) =>
    listener(event as TokenChangeEvent)
  );
}

export function addNotificationStateChangeListener(
  listener: (event: NotificationStateChangeEvent) => void
): Voidable<EventSubscription> {
  if (!assertAndroid('addNotificationStateChangeListener')) {
    return;
  }
  return eventEmitter.addListener('onNotificationStateChange', (event) =>
    listener(event as NotificationStateChangeEvent)
  );
}

export type {
  LiveUpdateConfig,
  LiveUpdateImage,
  LiveUpdateProgress,
  LiveUpdateProgressPoint,
  LiveUpdateProgressSegment,
  LiveUpdateState,
  NotificationStateChangeListener,
  NotificationStateChangeEvent,
  TokenChangeEvent,
} from './types';
