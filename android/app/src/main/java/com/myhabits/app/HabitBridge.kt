package com.myhabits.app

import android.content.Context
import android.content.Intent
import android.webkit.JavascriptInterface

/**
 * JavaScript bridge that lets the web app push its state into SharedPreferences
 * so the native widget can read it. Web side calls window.MyHabitsBridge.saveState(json)
 * after every state change. After a save we broadcast REFRESH_WIDGETS so any
 * placed widgets re-render.
 */
class HabitBridge(private val ctx: Context) {

    @JavascriptInterface
    fun saveState(json: String) {
        if (json.isBlank()) return
        HabitStore(ctx).writeRaw(json)
        ctx.sendBroadcast(
            Intent(ACTION_REFRESH).setPackage(ctx.packageName)
        )
    }

    @JavascriptInterface
    fun getState(): String {
        return HabitStore(ctx).readRaw() ?: ""
    }

    companion object {
        const val NAME = "MyHabitsBridge"
        const val ACTION_REFRESH = "com.myhabits.app.REFRESH_WIDGETS"
    }
}
