package com.myhabits.app

import android.annotation.SuppressLint
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                allowFileAccess = true
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false
            }
            setBackgroundColor(0xFF0B0C0E.toInt())
            addJavascriptInterface(HabitBridge(this@MainActivity), HabitBridge.NAME)
        }
        setContentView(webView)

        // Match the dark theme: keep the system bars dark with light icons.
        window.statusBarColor = 0xFF0B0C0E.toInt()
        window.navigationBarColor = 0xFF0B0C0E.toInt()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
            )
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility =
                window.decorView.systemUiVisibility and
                    View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
        }

        // Optional: widget tap dropped us here with the habit id in the intent.
        val openHabitId = intent?.getStringExtra(EXTRA_HABIT_ID)
        val target = if (openHabitId != null) {
            "file:///android_asset/web/index.html#habit=$openHabitId"
        } else {
            "file:///android_asset/web/index.html"
        }
        webView.loadUrl(target)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    companion object {
        const val EXTRA_HABIT_ID = "habit_id"
    }
}
