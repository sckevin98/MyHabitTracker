package com.myhabits.app

import android.content.Context

/**
 * Single SharedPreferences file shared by every widget that needs to remember
 * which habit it's bound to. Keyed by widget id, value is the habit id.
 */
object WidgetConfig {
    private const val PREFS = "widget_config"
    private fun key(widgetId: Int) = "habit_for_$widgetId"

    fun setHabit(ctx: Context, widgetId: Int, habitId: String?) {
        val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        if (habitId == null) prefs.remove(key(widgetId)) else prefs.putString(key(widgetId), habitId)
        prefs.apply()
    }

    fun getHabit(ctx: Context, widgetId: Int): String? =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(key(widgetId), null)

    fun forget(ctx: Context, widgetIds: IntArray) {
        val editor = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        widgetIds.forEach { editor.remove(key(it)) }
        editor.apply()
    }
}
