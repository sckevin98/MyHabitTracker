package com.myhabits.app

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import java.util.Calendar

/**
 * Renders a GitHub-style heatmap of a habit's completion history into a Bitmap.
 * Mirrors the algorithm used by the web `Heatmap` component in ui.jsx:
 * rightmost column = current week, today lands at row = today's weekday index.
 */
object HeatmapRenderer {

    private val ALPHAS = floatArrayOf(0.06f, 0.28f, 0.5f, 0.75f, 1.0f)

    fun render(
        habit: HabitStore.Habit,
        widthPx: Int,
        heightPx: Int,
    ): Bitmap {
        val safeW = widthPx.coerceAtLeast(64)
        val safeH = heightPx.coerceAtLeast(64)

        // Figure out a cell size + gap that fills the box with 7 rows.
        val gap = 3
        val cellByHeight = (safeH - 6 * gap) / 7
        val cellSize = cellByHeight.coerceAtLeast(4)
        val rowsPx = 7 * cellSize + 6 * gap
        val weeks = ((safeW + gap) / (cellSize + gap)).coerceAtLeast(4)

        val bitmap = Bitmap.createBitmap(safeW, safeH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.TRANSPARENT)

        val color = runCatching { Color.parseColor(habit.color) }.getOrDefault(Color.parseColor("#f97316"))
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)

        val today = Calendar.getInstance()
        // Mon=0..Sun=6 to match the web app
        val todayWd = (today.get(Calendar.DAY_OF_WEEK) + 5) % 7

        // Center vertically inside the available height
        val yOffset = ((safeH - rowsPx) / 2).coerceAtLeast(0)
        val rect = RectF()
        val cursor = Calendar.getInstance()

        for (w in 0 until weeks) {
            for (d in 0 until 7) {
                val daysFromToday = (weeks - 1 - w) * 7 + (todayWd - d)
                if (daysFromToday < 0) continue

                cursor.timeInMillis = today.timeInMillis
                cursor.add(Calendar.DAY_OF_MONTH, -daysFromToday)
                val dk = habit.dateKeyOf(cursor)
                val v = habit.entries[dk] ?: 0
                val level = when {
                    v == 0 -> 0
                    v.toFloat() / habit.target >= 1.0f -> 4
                    v.toFloat() / habit.target >= 0.66f -> 3
                    v.toFloat() / habit.target >= 0.33f -> 2
                    else -> 1
                }

                paint.color = if (level == 0) Color.WHITE else color
                paint.alpha = (ALPHAS[level] * 255).toInt()

                val x = (w * (cellSize + gap)).toFloat()
                val y = (yOffset + d * (cellSize + gap)).toFloat()
                rect.set(x, y, x + cellSize, y + cellSize)
                canvas.drawRoundRect(rect, 2f, 2f, paint)
            }
        }

        return bitmap
    }
}
