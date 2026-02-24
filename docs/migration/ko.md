# 마이그레이션 기록: expo-live-updates → react-native-android-live-updates

이 문서는 [`expo-live-updates`](https://github.com/software-mansion-labs/expo-live-updates)를
bare React Native TurboModule로 포팅한 작업의 기록이다.
향후 업스트림 변경사항을 머지할 때 참고용으로 사용한다.

---

## 업스트림 스냅샷

| 항목 | 값 |
|------|----|
| 저장소 | https://github.com/software-mansion-labs/expo-live-updates.git |
| 스냅샷 커밋 | `e8e58c1` — Update installation instructions in README.md (#60) |
| 패키지 버전 | `0.0.0` (pre-release) |
| 스냅샷 경로 | `.ref/expo-live-updates/` |

이 포팅의 초기 커밋: `6368f39` — feat: migrate expo-live-updates core to bare RN TurboModule

---

## 파일 매핑

### 거의 그대로 복사 (패키지명만 변경)

| 업스트림 | 이 저장소 | 비고 |
|----------|-----------|------|
| `expo/modules/liveupdates/LiveUpdatesManager.kt` | `com/androidliveupdates/liveupdates/LiveUpdatesManager.kt` | `canPostToChannel()` 추가 |
| `expo/modules/liveupdates/FirebaseService.kt` | `com/androidliveupdates/liveupdates/FirebaseService.kt` | 동일 |
| `expo/modules/liveupdates/IdGenerator.kt` | `com/androidliveupdates/liveupdates/IdGenerator.kt` | 동일 |
| `expo/modules/liveupdates/NotificationDismissedReceiver.kt` | `com/androidliveupdates/liveupdates/NotificationDismissedReceiver.kt` | 동일 |
| `expo/modules/liveupdates/NotificationStateEventEmitter.kt` | `com/androidliveupdates/liveupdates/NotificationStateEventEmitter.kt` | 동일 |

### 어댑터 수정이 필요했던 파일

| 업스트림 | 이 저장소 | 변경 내용 |
|----------|-----------|-----------|
| `expo/modules/liveupdates/LiveUpdatesTypes.kt` | `com/androidliveupdates/liveupdates/LiveUpdatesTypes.kt` | `expo.modules.kotlin.records.{Field,Record}` 제거, plain data class로 변환 |
| `expo/modules/liveupdates/TokenChangeHandler.kt` | `com/androidliveupdates/liveupdates/TokenChangeHandler.kt` | Firebase 미초기화 시 `IllegalStateException` 처리 추가 |
| `expo/modules/liveupdates/LiveUpdatesHelpers.kt` | `com/androidliveupdates/liveupdates/LiveUpdatesHelpers.kt` | 에러 메시지를 bare RN 기준으로 수정 (AndroidManifest.xml 안내) |

### 완전 재작성

| 업스트림 | 이 저장소 | 변경 내용 |
|----------|-----------|-----------|
| `ExpoLiveUpdatesModule.kt` (Expo Module API) | `AndroidLiveUpdatesModule.kt` | RN TurboModule (`NativeAndroidLiveUpdatesSpec`) 구현으로 재작성 |
| — | `AndroidLiveUpdatesPackage.kt` | RN 패키지 등록 (신규) |
| `src/ExpoLiveUpdatesModule.ts` | `src/NativeAndroidLiveUpdates.ts` | TurboModule Spec 인터페이스 (신규) |
| `src/ExpoLiveUpdatesModule.ts` | `src/ExpoLiveUpdatesModule.ts` | native module re-export로 단순화 |
| `src/index.ts` | `src/index.ts` | `expo-modules-core` → `NativeEventEmitter` / `TurboModuleRegistry`로 교체 |

---

## 업스트림 대비 의도적 발산(divergence) 목록

향후 업스트림 동기화 시 이 항목들은 **덮어쓰지 말 것**.

### 1. `AndroidLiveUpdatesModule` — `removeListeners` 동작

업스트림의 `ExpoLiveUpdatesModule`은 `OnCreate`에서 `NotificationStateEventEmitter.sendEvent`를
세팅하고 절대 null로 만들지 않는다. 이 포트는 RN TurboModule 관례에 따라 `addListener`/`removeListeners`를
구현하되, **`NotificationStateEventEmitter.sendEvent`는 리스너가 0이 되어도 null로 만들지 않는다.**
(`TokenChangeHandler.sendEvent`만 null로 초기화)

이 차이가 없으면 리스너를 모두 제거한 뒤 발생하는 DISMISSED/STOPPED 이벤트가 유실된다.

### 2. `LiveUpdatesManager` — `canPostToChannel()` 추가

업스트림에는 없는 메서드. 알림 발행 전 앱 레벨 알림 비활성화 및 채널 비활성화 여부를 사전 체크한다.
업스트림이 이를 추가하면 이 메서드는 제거해도 된다.

### 3. `TokenChangeHandler` — Firebase 초기화 에러 처리

`sendEvent` setter 내부에서 `FirebaseMessaging.getInstance().token` 호출 시
`IllegalStateException`을 catch하는 블록이 추가되어 있다.
업스트림 PR [#54](https://github.com/software-mansion-labs/expo-live-updates/pull/54) 이후 반영된 내용이
아직 이 저장소에는 없어서 포팅 시 직접 추가했다.

### 4. `LiveUpdatesHelpers` — 에러 메시지

업스트림의 에러 메시지는 Expo 플러그인(`withChannelConfig`, `app.config.ts`)을 안내한다.
이 포트에서는 `AndroidManifest.xml`에 `<meta-data>`를 추가하는 방법으로 안내를 변경했다.
**메타데이터 키 이름 자체(`expo.modules.liveupdates.channelId` 등)는 의도적으로 유지한다.**
(업스트림에서 Expo 프로젝트로 마이그레이션하거나 역방향 이동 시 호환성 유지를 위해)

### 5. `startLiveUpdate` 반환값

업스트림 JS: `null`을 그대로 반환할 수 있음
이 포트 JS: native가 `-1`을 반환하면 `undefined`로 변환 (`notificationId > 0` 체크)

---

## 향후 업스트림 동기화 방법

1. `.ref/expo-live-updates/`에서 최신 커밋을 pull
   ```bash
   git -C .ref/expo-live-updates pull origin main
   ```
2. 위 **파일 매핑** 표를 보고 업스트림 변경 파일을 확인
3. "거의 그대로 복사" 파일은 패키지명만 바꿔 반영
4. **의도적 발산 목록** 항목이 업스트림에서 어떻게 바뀌었는지 먼저 확인 후 병합 여부 결정
5. 이 문서의 **스냅샷 커밋**과 날짜를 업데이트
