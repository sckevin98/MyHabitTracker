package com.myhabits.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews

/**
 * 4×2 widget showing the top 4 habits by streak — pure text, no Canvas.
 * No configure activity: it always picks the leaders from the current state.
 */
class StreaksWidget : AppWidgetProvider() {

    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) render(ctx, mgr, id)
    }

    override fun onReceive(ctx: Context, intent: Intent) {
        super.onReceive(ctx, intent)
        if (intent.action == HabitBridge.ACTION_REFRESH) {
            val mgr = AppWidgetManager.getInstance(ctx)
            mgr.getAppWidgetIds(ComponentName(ctx, StreaksWidget::class.java))
                .forEach { render(ctx, mgr, it) }
        }
    }

    private fun render(ctx: Context, mgr: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(ctx.packageName, R.layout.widget_streaks)
        val top = HabitStore(ctx).readState()?.habits
            ?.map { it to it.streak() }
            ?.filter { it.second > 0 }
            ?.sortedByDescending { it.second }
            ?.take(SLOT_IDS.size)
            .orEmpty()

        for (i in SLOT_IDS.indices) {
            if (i >= top.size) {
                views.setViewVisibility(SLOT_IDS[i], android.view.View.INVISIBLE)
                continue
            }
            val (h, s) = top[i]
            val color = runCatching { Color.parseColor(h.color) }.getOrDefault(Color.parseColor("#f97316"))
            views.setViewVisibility(SLOT_IDS[i], android.view.View.VISIBLE)
            views.setTextViewText(ICON_IDS[i], h.icon.ifBlank { "🌱" })
            views.setTextViewText(NAME_IDS[i], h.name)
            views.setTextViewText(STREAK_IDS[i], s.toString())
            views.setTextColor(STREAK_IDS[i], color)
        }

        val open = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        views.setOnClickPendingIntent(
            R.id.streaks_root,
            PendingIntent.getActivity(
                ctx, widgetId, open,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            ),
        )

        mgr.updateAppWidget(widgetId, views)
    }

    companion object {
        private val SLOT_IDS = intArrayOf(R.id.streak0, R.id.streak1, R.id.streak2, R.id.streak3)
        private val ICON_IDS = intArrayOf(R.id.streak0_icon, R.id.streak1_icon, R.id.streak2_icon, R.id.streak3_icon)
        private val NAME_IDS = intArrayOf(R.id.streak0_name, R.id.streak1_name, R.id.streak2_name, R.id.streak3_name)
        private val STREAK_IDS = intArrayOf(R.id.streak0_value, R.id.streak1_value, R.id.streak2_value, R.id.streak3_value)
    }
}
