package com.androidliveupdates

import com.facebook.react.bridge.ReactApplicationContext

class AndroidLiveUpdatesModule(reactContext: ReactApplicationContext) :
  NativeAndroidLiveUpdatesSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeAndroidLiveUpdatesSpec.NAME
  }
}
