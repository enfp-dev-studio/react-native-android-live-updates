package com.androidliveupdates

import android.app.Activity
import android.app.NotificationChannel
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.content.ContextCompat.getSystemService
import com.androidliveupdates.liveupdates.FirebaseService
import com.androidliveupdates.liveupdates.LiveUpdateConfig
import com.androidliveupdates.liveupdates.LiveUpdateImage
import com.androidliveupdates.liveupdates.LiveUpdateProgress
import com.androidliveupdates.liveupdates.LiveUpdateProgressPoint
import com.androidliveupdates.liveupdates.LiveUpdateProgressSegment
import com.androidliveupdates.liveupdates.LiveUpdateState
import com.androidliveupdates.liveupdates.LiveUpdatesManager
import com.androidliveupdates.liveupdates.LiveUpdatesModuleEvents
import com.androidliveupdates.liveupdates.NotificationAction
import com.androidliveupdates.liveupdates.NotificationActionExtra
import com.androidliveupdates.liveupdates.NotificationStateEventEmitter
import com.androidliveupdates.liveupdates.TokenChangeHandler
import com.androidliveupdates.liveupdates.checkPostNotificationPermission
import com.androidliveupdates.liveupdates.getChannelId
import com.androidliveupdates.liveupdates.getChannelName
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

class AndroidLiveUpdatesModule(reactContext: ReactApplicationContext) :
  NativeAndroidLiveUpdatesSpec(reactContext), ActivityEventListener {

  private val context = reactApplicationContext
  private lateinit var liveUpdatesManager: LiveUpdatesManager
  private var listenersCount = 0

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun startLiveUpdate(state: ReadableMap, config: ReadableMap?): Double {
    checkPostNotificationPermission()
    ensureInitialized()
    val notificationId =
      liveUpdatesManager.startLiveUpdateNotification(
        state = parseState(state),
        config = parseConfig(config),
      ) ?: -1
    return notificationId.toDouble()
  }

  override fun stopLiveUpdate(notificationId: Double) {
    ensureInitialized()
    liveUpdatesManager.stopNotification(notificationId.toInt())
  }

  override fun updateLiveUpdate(notificationId: Double, state: ReadableMap, config: ReadableMap?) {
    checkPostNotificationPermission()
    ensureInitialized()
    liveUpdatesManager.updateLiveUpdateNotification(
      notificationId = notificationId.toInt(),
      state = parseState(state),
      config = parseConfig(config),
    )
  }

  override fun addListener(eventName: String) {
    listenersCount += 1
    if (eventName == LiveUpdatesModuleEvents.ON_NOTIFICATION_STATE_CHANGE) {
      NotificationStateEventEmitter.sendEvent = ::sendEvent
    }
    if (eventName == LiveUpdatesModuleEvents.ON_TOKEN_CHANGE && FirebaseService.isFirebaseAvailable(context)) {
      TokenChangeHandler.sendEvent = ::sendEvent
    }
  }

  override fun removeListeners(count: Double) {
    listenersCount = (listenersCount - count.toInt()).coerceAtLeast(0)
    if (listenersCount == 0) {
      TokenChangeHandler.sendEvent = null
    }
  }

  override fun onNewIntent(intent: Intent) {
    if (isIntentSafe(intent)) {
      emitNotificationClickedEvent(intent)
    } else {
      Log.w(MODULE_TAG, "Rejected unsafe intent")
    }
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?,
  ) {
    // no-op
  }

  private fun ensureInitialized() {
    if (::liveUpdatesManager.isInitialized) {
      return
    }

    val channelId: String = getChannelId(context)
    val channelName: String = getChannelName(context)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val serviceChannel =
        NotificationChannel(
          channelId,
          channelName,
          android.app.NotificationManager.IMPORTANCE_DEFAULT,
        )

      val androidNotificationManager =
        getSystemService(context, android.app.NotificationManager::class.java)
      androidNotificationManager?.createNotificationChannel(serviceChannel)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.BAKLAVA) {
        val status =
          if (androidNotificationManager?.canPostPromotedNotifications() == true) "can"
          else "cannot"
        Log.i(MODULE_TAG, "$status post Live Updates")
      }
    }

    liveUpdatesManager = LiveUpdatesManager(context)
    NotificationStateEventEmitter.sendEvent = ::sendEvent
  }

  private fun sendEvent(eventName: String, payload: Bundle) {
    if (!context.hasActiveReactInstance()) {
      return
    }

    context
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, Arguments.fromBundle(payload))
  }

  private fun isIntentSafe(intent: Intent): Boolean =
    intent.action == Intent.ACTION_VIEW && intent.`package` == context.packageName

  private fun emitNotificationClickedEvent(intent: Intent) {
    val (action, notificationId) = getNotificationClickIntentExtra(intent)
    notificationId
      .takeIf { action == NotificationAction.CLICKED }
      ?.let { NotificationStateEventEmitter.emit(it, NotificationAction.CLICKED) }
  }

  private fun getNotificationClickIntentExtra(intent: Intent): Pair<NotificationAction?, Int?> {
    val action =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getSerializableExtra(
          NotificationActionExtra.NOTIFICATION_ACTION,
          NotificationAction::class.java,
        )
      } else {
        @Suppress("DEPRECATION")
        intent.getSerializableExtra(NotificationActionExtra.NOTIFICATION_ACTION)
          as? NotificationAction
      }

    val notificationId =
      intent.getIntExtra(NotificationActionExtra.NOTIFICATION_ID, -1).takeIf { it != -1 }

    return action to notificationId
  }

  private fun checkPostNotificationPermission() {
    if (!context.checkPostNotificationPermission()) {
      throw RuntimeException("${android.Manifest.permission.POST_NOTIFICATIONS} permission is not granted.")
    }
  }

  private fun parseState(state: ReadableMap): LiveUpdateState {
    return LiveUpdateState(
      title = getRequiredString(state, "title"),
      text = getString(state, "text"),
      subText = getString(state, "subText"),
      image = getMap(state, "image")?.let(::parseImage),
      icon = getMap(state, "icon")?.let(::parseImage),
      shortCriticalText = getString(state, "shortCriticalText"),
      progress = getMap(state, "progress")?.let(::parseProgress),
      showTime = getBoolean(state, "showTime"),
      time = getDouble(state, "time")?.toLong(),
    )
  }

  private fun parseConfig(config: ReadableMap?): LiveUpdateConfig? {
    if (config == null) {
      return null
    }
    return LiveUpdateConfig(
      deepLinkUrl = getString(config, "deepLinkUrl"),
      iconBackgroundColor = getString(config, "iconBackgroundColor"),
    )
  }

  private fun parseImage(image: ReadableMap): LiveUpdateImage {
    return LiveUpdateImage(
      url = getRequiredString(image, "url"),
      isRemote = getRequiredBoolean(image, "isRemote"),
    )
  }

  private fun parseProgress(progress: ReadableMap): LiveUpdateProgress {
    return LiveUpdateProgress(
      max = getDouble(progress, "max")?.toInt(),
      progress = getDouble(progress, "progress")?.toInt(),
      indeterminate = getBoolean(progress, "indeterminate"),
      points = getArray(progress, "points")?.let(::parseProgressPoints),
      segments = getArray(progress, "segments")?.let(::parseProgressSegments),
    )
  }

  private fun parseProgressPoints(points: ReadableArray): ArrayList<LiveUpdateProgressPoint> {
    val parsed = arrayListOf<LiveUpdateProgressPoint>()
    for (index in 0 until points.size()) {
      val point = points.getMap(index) ?: continue
      parsed.add(
        LiveUpdateProgressPoint(
          position = getRequiredDouble(point, "position").toInt(),
          color = getString(point, "color"),
        )
      )
    }
    return parsed
  }

  private fun parseProgressSegments(segments: ReadableArray): ArrayList<LiveUpdateProgressSegment> {
    val parsed = arrayListOf<LiveUpdateProgressSegment>()
    for (index in 0 until segments.size()) {
      val segment = segments.getMap(index) ?: continue
      parsed.add(
        LiveUpdateProgressSegment(
          length = getRequiredDouble(segment, "length").toInt(),
          color = getString(segment, "color"),
        )
      )
    }
    return parsed
  }

  private fun getMap(map: ReadableMap, key: String): ReadableMap? {
    return if (map.hasKey(key) && !map.isNull(key)) map.getMap(key) else null
  }

  private fun getArray(map: ReadableMap, key: String): ReadableArray? {
    return if (map.hasKey(key) && !map.isNull(key)) map.getArray(key) else null
  }

  private fun getString(map: ReadableMap, key: String): String? {
    return if (map.hasKey(key) && !map.isNull(key)) map.getString(key) else null
  }

  private fun getRequiredString(map: ReadableMap, key: String): String {
    return getString(map, key) ?: throw IllegalArgumentException("Missing required property: $key")
  }

  private fun getBoolean(map: ReadableMap, key: String): Boolean? {
    return if (map.hasKey(key) && !map.isNull(key)) map.getBoolean(key) else null
  }

  private fun getRequiredBoolean(map: ReadableMap, key: String): Boolean {
    return getBoolean(map, key) ?: throw IllegalArgumentException("Missing required property: $key")
  }

  private fun getDouble(map: ReadableMap, key: String): Double? {
    return if (map.hasKey(key) && !map.isNull(key)) map.getDouble(key) else null
  }

  private fun getRequiredDouble(map: ReadableMap, key: String): Double {
    return getDouble(map, key) ?: throw IllegalArgumentException("Missing required property: $key")
  }

  companion object {
    private const val MODULE_TAG = "AndroidLiveUpdates"
    const val NAME = NativeAndroidLiveUpdatesSpec.NAME
  }
}
