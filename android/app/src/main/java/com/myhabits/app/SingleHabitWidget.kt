package com.myhabits.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.widget.RemoteViews

/**
 * 2×2 widget that shows a single habit: name, today's status, current streak.
 * The chosen habit is stored per-widget in SharedPreferences so multiple widgets
 * on the home screen can show different habits.
 */
class SingleHabitWidget : AppWidgetProvider() {

    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) render(ctx, mgr, id)
    }

    override fun onReceive(ctx: Context, intent: Intent) {
        super.onReceive(ctx, intent)
        if (intent.action == HabitBridge.ACTION_REFRESH) {
            val mgr = AppWidgetManager.getInstance(ctx)
            val ids = mgr.getAppWidgetIds(
                android.content.ComponentName(ctx, SingleHabitWidget::class.java)
            )
            for (id in ids) render(ctx, mgr, id)
        }
    }

    override fun onDeleted(ctx: Context, ids: IntArray) {
        val prefs = configPrefs(ctx)
        prefs.edit().apply {
            ids.forEach { remove(habitKey(it)) }
            apply()
        }
    }

    private fun render(ctx: Context, mgr: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(ctx.packageName, R.layout.widget_single)
        val habitId = configPrefs(ctx).getString(habitKey(widgetId), null)
        val state = HabitStore(ctx).readState()
        val habit = state?.habits?.firstOrNull { it.id == habitId }

        if (habit == null) {
            views.setTextViewText(R.id.widget_icon, "🌱")
            views.setTextViewText(R.id.widget_name, ctx.getString(R.string.widget_pick_habit))
            views.setTextViewText(R.id.widget_status, "—")
            views.setTextViewText(R.id.widget_streak, "")
            views.setInt(R.id.widget_root, "setBackgroundColor", Color.parseColor("#17181c"))
        } else {
            val color = runCatching { Color.parseColor(habit.color) }.getOrDefault(Color.parseColor("#f97316"))
            val streak = habit.streak()
            val progress = habit.todayProgress()
            val done = habit.todayDone()

            views.setTextViewText(R.id.widget_icon, habit.icon.ifBlank { "🌱" })
            views.setTextViewText(R.id.widget_name, habit.name)
            views.setTextViewText(
                R.id.widget_status,
                if (habit.target == 1) {
                    if (done) ctx.getString(R.string.widget_done_today)
                    else ctx.getString(R.string.widget_not_done_today)
                } else {
                    "$progress / ${habit.target}"
                }
            )
            views.setTextViewText(
                R.id.widget_streak,
                ctx.resources.getQuantityString(R.plurals.day_streak, streak, streak),
            )
            views.setTextColor(R.id.widget_streak, color)
            views.setInt(R.id.widget_root, "setBackgroundColor", Color.parseColor("#17181c"))
        }

        // Tap → open the app on this habit's detail (or just the home tab if none).
        val openIntent = Intent(ctx, MainActivity::class.java).apply {
            action = "com.myhabits.app.OPEN_HABIT"
            putExtra(MainActivity.EXTRA_HABIT_ID, habitId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pi = PendingIntent.getActivity(
            ctx,
            widgetId,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(R.id.widget_root, pi)

        mgr.updateAppWidget(widgetId, views)
    }

    companion object {
        const val PREFS = "widget_config"
        fun configPrefs(ctx: Context): SharedPreferences =
            ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        fun habitKey(widgetId: Int) = "habit_for_$widgetId"
    }
}
