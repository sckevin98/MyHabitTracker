package com.myhabits.app

import android.annotation.SuppressLint
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Lets you debug a running APK from your laptop via chrome://inspect.
        // Cheap to leave on for our personal-use app.
        WebView.setWebContentsDebuggingEnabled(true)

        // Serve files in src/main/assets/web/ at https://appassets.androidplatform.net/web/
        // so the page runs as a same-origin HTTPS document. file:// would block
        // Babel-Standalone's fetch of the .jsx files and leave the screen black.
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/web/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = false
            }
            setBackgroundColor(0xFF0B0C0E.toInt())
            addJavascriptInterface(HabitBridge(this@MainActivity), HabitBridge.NAME)

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest,
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)
            }

            // Forward console.log / console.error from the page to Android Logcat
            // so we can see what's happening from `adb logcat` if anything else breaks.
            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(msg: ConsoleMessage): Boolean {
                    android.util.Log.d(
                        "MyHabitsWeb",
                        "[${msg.messageLevel()}] ${msg.message()} (${msg.sourceId()}:${msg.lineNumber()})",
                    )
                    return true
                }
            }
        }
        setContentView(webView)

        // Match the dark theme on the system bars.
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

        val openHabitId = intent?.getStringExtra(EXTRA_HABIT_ID)
        val target = if (openHabitId != null) {
            "https://appassets.androidplatform.net/web/index.html#habit=$openHabitId"
        } else {
            "https://appassets.androidplatform.net/web/index.html"
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
