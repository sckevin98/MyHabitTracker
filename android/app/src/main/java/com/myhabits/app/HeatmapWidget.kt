package com.myhabits.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.TypedValue
import android.widget.RemoteViews

/**
 * 4×2 or 4×4 heatmap widget — renders the habit's history as a GitHub-style
 * contribution grid via HeatmapRenderer (Bitmap), since RemoteViews has no
 * native Canvas/SVG support.
 */
class HeatmapWidget : AppWidgetProvider() {

    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) render(ctx, mgr, id)
    }

    override fun onReceive(ctx: Context, intent: Intent) {
        super.onReceive(ctx, intent)
        if (intent.action == HabitBridge.ACTION_REFRESH) {
            val mgr = AppWidgetManager.getInstance(ctx)
            mgr.getAppWidgetIds(ComponentName(ctx, HeatmapWidget::class.java))
                .forEach { render(ctx, mgr, it) }
        }
    }

    override fun onAppWidgetOptionsChanged(
        ctx: Context,
        mgr: AppWidgetManager,
        widgetId: Int,
        newOptions: Bundle,
    ) {
        render(ctx, mgr, widgetId)
    }

    override fun onDeleted(ctx: Context, ids: IntArray) {
        WidgetConfig.forget(ctx, ids)
    }

    private fun render(ctx: Context, mgr: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(ctx.packageName, R.layout.widget_heatmap)
        val habit = WidgetConfig.getHabit(ctx, widgetId)?.let { id ->
            HabitStore(ctx).readState()?.habits?.firstOrNull { it.id == id }
        }

        if (habit == null) {
            views.setTextViewText(R.id.heatmap_icon, "🌱")
            views.setTextViewText(R.id.heatmap_name, ctx.getString(R.string.widget_pick_habit))
            views.setTextViewText(R.id.heatmap_streak, "")
            views.setImageViewBitmap(R.id.heatmap_image, null)
        } else {
            val color = runCatching { Color.parseColor(habit.color) }.getOrDefault(Color.parseColor("#f97316"))
            views.setTextViewText(R.id.heatmap_icon, habit.icon.ifBlank { "🌱" })
            views.setTextViewText(R.id.heatmap_name, habit.name)
            val streak = habit.streak()
            views.setTextViewText(
                R.id.heatmap_streak,
                ctx.resources.getQuantityString(R.plurals.day_streak, streak, streak),
            )
            views.setTextColor(R.id.heatmap_streak, color)

            val (wPx, hPx) = currentSizePx(ctx, mgr, widgetId)
            // Reserve ~52dp for the header row; the rest goes to the heatmap.
            val headerDp = 52
            val headerPx = TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, headerDp.toFloat(), ctx.resources.displayMetrics,
            ).toInt()
            val imgH = (hPx - headerPx).coerceAtLeast(40)
            val imgW = wPx.coerceAtLeast(120)
            val bitmap = HeatmapRenderer.render(habit, imgW, imgH)
            views.setImageViewBitmap(R.id.heatmap_image, bitmap)
        }

        // Tap → open the habit detail
        val open = Intent(ctx, MainActivity::class.java).apply {
            action = "com.myhabits.app.OPEN_HABIT"
            putExtra(MainActivity.EXTRA_HABIT_ID, habit?.id)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        views.setOnClickPendingIntent(
            R.id.heatmap_root,
            PendingIntent.getActivity(
                ctx, widgetId, open,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            ),
        )

        mgr.updateAppWidget(widgetId, views)
    }

    private fun currentSizePx(ctx: Context, mgr: AppWidgetManager, widgetId: Int): Pair<Int, Int> {
        val opts = mgr.getAppWidgetOptions(widgetId)
        val portrait = ctx.resources.configuration.orientation ==
            android.content.res.Configuration.ORIENTATION_PORTRAIT
        val wDp = if (portrait) opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 320)
                  else opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 320)
        val hDp = if (portrait) opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 160)
                  else opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 160)
        val dm = ctx.resources.displayMetrics
        // Leave a little padding so the bitmap doesn't bleed into the widget frame.
        val padDp = 28
        val w = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, (wDp - padDp).toFloat(), dm).toInt()
        val h = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, (hDp - padDp).toFloat(), dm).toInt()
        return Pair(w.coerceAtLeast(120), h.coerceAtLeast(60))
    }
}
