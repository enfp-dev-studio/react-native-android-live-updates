import { TurboModuleRegistry, type TurboModule } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  startLiveUpdate(state: UnsafeObject, config?: UnsafeObject): number;
  stopLiveUpdate(notificationId: number): void;
  updateLiveUpdate(
    notificationId: number,
    state: UnsafeObject,
    config?: UnsafeObject
  ): void;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AndroidLiveUpdates');
