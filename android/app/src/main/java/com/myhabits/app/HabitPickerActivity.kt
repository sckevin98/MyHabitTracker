package com.myhabits.app

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * Launched by the launcher when the user drops the widget on the home screen.
 * Shows a list of habits — tapping one binds it to this widget and finishes.
 */
class HabitPickerActivity : AppCompatActivity() {

    private var widgetId: Int = AppWidgetManager.INVALID_APPWIDGET_ID

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setResult(Activity.RESULT_CANCELED)

        widgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID,
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        val state = HabitStore(this).readState()
        val habits = state?.habits.orEmpty()

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 64, 48, 64)
            setBackgroundColor(0xFF0B0C0E.toInt())
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }
        container.addView(TextView(this).apply {
            text = getString(R.string.picker_title)
            setTextColor(0xFFF3F4F6.toInt())
            textSize = 20f
            setPadding(0, 0, 0, 32)
        })

        if (habits.isEmpty()) {
            container.addView(TextView(this).apply {
                text = getString(R.string.picker_empty)
                setTextColor(0xFF8A8D95.toInt())
                textSize = 14f
            })
        } else {
            for (h in habits) {
                container.addView(TextView(this).apply {
                    text = "${h.icon.ifBlank { "🌱" }}  ${h.name}"
                    setTextColor(0xFFF3F4F6.toInt())
                    textSize = 16f
                    setPadding(0, 28, 0, 28)
                    isClickable = true
                    isFocusable = true
                    setOnClickListener { pick(h.id) }
                })
            }
        }
        setContentView(container)
    }

    private fun pick(habitId: String) {
        WidgetConfig.setHabit(this, widgetId, habitId)

        // Ask the launcher to redraw whichever widget class owns this id.
        val mgr = AppWidgetManager.getInstance(this)
        val provider = mgr.getAppWidgetInfo(widgetId)?.provider
        if (provider != null) {
            val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                component = provider
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(widgetId))
            }
            sendBroadcast(intent)
        }

        val result = Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
        setResult(Activity.RESULT_OK, result)
        finish()
    }
}
