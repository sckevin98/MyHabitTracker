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
 * 4×4 widget that shows up to 8 habits in a 2×4 grid: icon + name + today
 * status. No configure activity — picks up every non-archived habit, sorted
 * by current streak descending so the most-active habits surface first.
 */
class AllHabitsWidget : AppWidgetProvider() {

    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) render(ctx, mgr, id)
    }

    override fun onReceive(ctx: Context, intent: Intent) {
        super.onReceive(ctx, intent)
        if (intent.action == HabitBridge.ACTION_REFRESH) {
            val mgr = AppWidgetManager.getInstance(ctx)
            mgr.getAppWidgetIds(ComponentName(ctx, AllHabitsWidget::class.java))
                .forEach { render(ctx, mgr, it) }
        }
    }

    private fun render(ctx: Context, mgr: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(ctx.packageName, R.layout.widget_all_habits)
        val habits = HabitStore(ctx).readState()?.habits
            ?.sortedByDescending { it.streak() }
            ?.take(MAX_CELLS)
            .orEmpty()

        for (i in 0 until MAX_CELLS) {
            val cellId = CELL_IDS[i]
            val iconId = ICON_IDS[i]
            val nameId = NAME_IDS[i]
            val statusId = STATUS_IDS[i]
            val barId = BAR_IDS[i]

            if (i >= habits.size) {
                views.setViewVisibility(cellId, android.view.View.INVISIBLE)
                continue
            }
            val h = habits[i]
            val color = runCatching { Color.parseColor(h.color) }.getOrDefault(Color.parseColor("#f97316"))
            views.setViewVisibility(cellId, android.view.View.VISIBLE)
            views.setTextViewText(iconId, h.icon.ifBlank { "🌱" })
            views.setTextViewText(nameId, h.name)
            views.setTextViewText(
                statusId,
                if (h.target == 1) {
                    if (h.todayDone()) "✓" else "—"
                } else {
                    "${h.todayProgress()}/${h.target}"
                },
            )
            views.setTextColor(statusId, if (h.todayDone()) color else Color.parseColor("#8a8d95"))
            views.setProgressBar(
                barId,
                h.target,
                h.todayProgress().coerceAtMost(h.target),
                false,
            )
            // setProgressBar doesn't accept a tint; we set the secondaryProgress and
            // rely on the drawable defined in layout to take the accent color.
        }

        // Whole-widget tap → open the app's main screen
        val open = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        views.setOnClickPendingIntent(
            R.id.allhabits_root,
            PendingIntent.getActivity(
                ctx, widgetId, open,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            ),
        )

        mgr.updateAppWidget(widgetId, views)
    }

    companion object {
        private const val MAX_CELLS = 8
        private val CELL_IDS = intArrayOf(
            R.id.cell0, R.id.cell1, R.id.cell2, R.id.cell3,
            R.id.cell4, R.id.cell5, R.id.cell6, R.id.cell7,
        )
        private val ICON_IDS = intArrayOf(
            R.id.cell0_icon, R.id.cell1_icon, R.id.cell2_icon, R.id.cell3_icon,
            R.id.cell4_icon, R.id.cell5_icon, R.id.cell6_icon, R.id.cell7_icon,
        )
        private val NAME_IDS = intArrayOf(
            R.id.cell0_name, R.id.cell1_name, R.id.cell2_name, R.id.cell3_name,
            R.id.cell4_name, R.id.cell5_name, R.id.cell6_name, R.id.cell7_name,
        )
        private val STATUS_IDS = intArrayOf(
            R.id.cell0_status, R.id.cell1_status, R.id.cell2_status, R.id.cell3_status,
            R.id.cell4_status, R.id.cell5_status, R.id.cell6_status, R.id.cell7_status,
        )
        private val BAR_IDS = intArrayOf(
            R.id.cell0_bar, R.id.cell1_bar, R.id.cell2_bar, R.id.cell3_bar,
            R.id.cell4_bar, R.id.cell5_bar, R.id.cell6_bar, R.id.cell7_bar,
        )
    }
}
