import java.net.URI

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.myhabits.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.myhabits.app"
        minSdk = 26          // Android 8.0 — covers WebView features we need
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Use the debug keystore so unsigned-CI builds still install via sideload.
            // Replace later if you publish.
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        viewBinding = false
    }
    sourceSets {
        getByName("main") {
            // Web assets are populated by the prepareWebAssets task below.
            assets.srcDirs("src/main/assets")
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
}

// ── Web-asset bundling ───────────────────────────────────────────────────────
// Copies the PWA files from the repo root into assets/web/ and rewrites
// the CDN <script> tags in index.html to point at the bundled vendor/ copies
// so the app runs fully offline.
val repoRoot = rootProject.projectDir.parentFile
val assetsWebDir = layout.projectDirectory.dir("src/main/assets/web")

val downloadVendor = tasks.register("downloadVendor") {
    description = "Downloads React + ReactDOM + Babel Standalone into assets/web/vendor/."
    group = "web-assets"

    val vendorDir = assetsWebDir.dir("vendor").asFile
    val files = mapOf(
        "react.development.js"      to "https://unpkg.com/react@18.3.1/umd/react.development.js",
        "react-dom.development.js"  to "https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js",
        "babel.min.js"              to "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js",
    )

    outputs.dir(vendorDir)
    outputs.upToDateWhen { files.keys.all { vendorDir.resolve(it).exists() } }

    doLast {
        vendorDir.mkdirs()
        for ((name, url) in files) {
            val target = vendorDir.resolve(name)
            if (target.exists()) continue
            logger.lifecycle("Fetching $url → $name")
            URI(url).toURL().openStream().use { input ->
                target.outputStream().use { input.copyTo(it) }
            }
        }
    }
}

val prepareWebAssets = tasks.register<Copy>("prepareWebAssets") {
    description = "Copies the PWA source files into assets/web/ and rewrites CDN imports."
    group = "web-assets"
    dependsOn(downloadVendor)

    from(repoRoot) {
        include(
            "index.html",
            "manifest.webmanifest",
            "icon.svg",
            "icon-maskable.svg",
            "lib.js",
            "*.jsx",
        )
        // sw.js is intentionally excluded — the WebView doesn't run a service worker
        // and bundled assets are already offline.
        exclude("sw.js")
    }
    into(assetsWebDir)

    filesMatching("index.html") {
        filter { line ->
            line
                .replace(
                    "https://unpkg.com/react@18.3.1/umd/react.development.js",
                    "vendor/react.development.js",
                )
                .replace(
                    "https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js",
                    "vendor/react-dom.development.js",
                )
                .replace(
                    "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js",
                    "vendor/babel.min.js",
                )
                // Drop SRI hashes — they were computed against the unpkg payloads.
                .replace(Regex(" integrity=\"[^\"]+\""), "")
                // Drop crossorigin — irrelevant for file:// assets.
                .replace(Regex(" crossorigin=\"[^\"]+\""), "")
                // Service worker registration is irrelevant in the native shell.
                .replace(
                    Regex("if \\('serviceWorker' in navigator\\)[\\s\\S]*?\\}\\);"),
                    "// service worker disabled in Android shell",
                )
        }
    }
}

tasks.named("preBuild") { dependsOn(prepareWebAssets) }
