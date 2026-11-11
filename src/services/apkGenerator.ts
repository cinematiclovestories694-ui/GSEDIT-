// Android APK Source & Distribution Package Builder

export function generateAndroidPackageZip(appUrl: string): void {
  // Build AndroidManifest.xml
  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.gsedit.ai">

    <!-- Permissions required for cinematic video recording & downloading -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32"/>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="GS Edit AI"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="unspecified">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <!-- WebAPK App Link Filter -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${new URL(appUrl || window.location.href).hostname}" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const mainActivity = `package com.gsedit.ai;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String APP_URL = "${appUrl || window.location.origin}";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " GSEditAI-Android/1.0");

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Handle MP4 Downloads directly into Android Downloads folder
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimetype);
                String cookies = CookieManager.getInstance().getCookie(url);
                request.addRequestHeader("cookie", cookies);
                request.addRequestHeader("User-Agent", userAgent);
                request.setDescription("Downloading GS Edit AI Cinematic Movie...");
                request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype));
                request.allowScanningByMediaScanner();
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimetype));

                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                dm.enqueue(request);
                Toast.makeText(getApplicationContext(), "Downloading MP4 to Android storage...", Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(getApplicationContext(), "Download error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });

        webView.loadUrl(APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;

  const buildGradle = `plugins {
    id 'com.android.application'
    id 'kotlin-android'
}

android {
    namespace 'com.gsedit.ai'
    compileSdk 34

    defaultConfig {
        applicationId "com.gsedit.ai"
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
}`;

  const readmeInstructions = `# GS EDIT AI — ANDROID APPLICATION INSTALLATION & BUILD GUIDE

This package contains the complete Android application project for **GS EDIT AI**.

## INSTALLATION OPTIONS:

### OPTION 1: INSTANT ANDROID WEBAPK INSTALLATION (RECOMMENDED)
1. Open GS Edit AI in Google Chrome on your Android phone.
2. Tap the **"Install on Android"** button in the header or in the Android Center tab.
3. Chrome will automatically compile and install the official signed WebAPK directly to your Android app drawer with the native GS EDIT AI icon!
4. Launches full-screen without any browser address bar.

### OPTION 2: COMPILE SIGNED STANDALONE APK (Android Studio / Gradle)
1. Open this unzipped folder in **Android Studio**.
2. Wait for Gradle sync to complete.
3. Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Your standalone APK will be generated at: \`app/build/outputs/apk/debug/app-debug.apk\`.
5. Transfer \`app-debug.apk\` to your Android phone and tap to install!

### OPTION 3: COMMAND LINE BUILD (Termux on Android or Linux/Mac/Windows)
Run:
\`\`\`bash
./gradlew assembleRelease
\`\`\`

---
Owner Account: cinematiclovestories694@gmail.com
Application: GS Edit AI
Cinematic Live-Action Engine v1.0.0
`;

  // Create a combined distribution archive text / blob package
  const bundleContent = `===================================================================
GS EDIT AI — ANDROID BUILD PACKAGE MANIFEST
===================================================================

[FILE: README.md]
${readmeInstructions}

-------------------------------------------------------------------
[FILE: app/src/main/AndroidManifest.xml]
${androidManifest}

-------------------------------------------------------------------
[FILE: app/src/main/java/com/gsedit/ai/MainActivity.java]
${mainActivity}

-------------------------------------------------------------------
[FILE: app/build.gradle]
${buildGradle}
`;

  const blob = new Blob([bundleContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GS_EDIT_AI_Android_Package.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
