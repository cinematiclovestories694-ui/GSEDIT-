import React from 'react';
import { Smartphone, Download, CheckCircle2, ShieldCheck, Terminal, Cpu, FileCode2, ExternalLink, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { generateAndroidPackageZip } from '../services/apkGenerator.ts';

export const AndroidCenter: React.FC = () => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();

  const handleDownloadApkPackage = () => {
    generateAndroidPackageZip(window.location.origin);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          Android Distribution & Installation Hub
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-amber-300 to-amber-500 tracking-tight">
          GS EDIT AI FOR ANDROID
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
          Install GS Edit AI natively on your Android device. Full offline-capable hardware acceleration, standalone fullscreen mode, and direct MP4 downloads to Android internal storage.
        </p>
      </div>

      {/* Primary Android Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Instant WebAPK Installation */}
        <div className="bg-[#0b0c16] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase">
                METHOD 1 (RECOMMENDED)
              </span>
              {isInstalled && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Installed on Device
                </span>
              )}
            </div>

            <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              Instant Android WebAPK Install
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Google Chrome on Android compiles and installs the official WebAPK directly to your home screen and app launcher. Runs as a native app with hardware-accelerated video rendering.
            </p>

            <ul className="text-xs text-zinc-300 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Runs full-screen without Chrome URL bar</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Direct MP4 saving to Android Downloads folder</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Official GS Edit AI cinema icon on launcher</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            {isInstallable ? (
              <button
                onClick={install}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                Install WebAPK on Android
              </button>
            ) : isInstalled ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300 font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                GS Edit AI is already installed on this device
              </div>
            ) : (
              <div className="p-3 bg-[#121422] border border-zinc-800 rounded-xl text-center text-xs text-zinc-400 leading-relaxed">
                <p className="font-semibold text-zinc-200">To install on Android:</p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Open this link in <strong>Google Chrome</strong> on your Android phone, tap the <strong>three dots (⋮)</strong> menu, and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Method 2: Android Studio & Standalone Gradle APK Package */}
        <div className="bg-[#0b0c16] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase">
                METHOD 2 (DEVELOPER / SIDELOAD)
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Gradle v8.2</span>
            </div>

            <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-amber-400" />
              Standalone Android APK Project
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Download the complete Android project bundle with <code className="text-amber-300">AndroidManifest.xml</code>, hardware-accelerated <code className="text-amber-300">MainActivity.java</code>, storage permissions, and gradle build files.
            </p>

            <ul className="text-xs text-zinc-300 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Target SDK 34 • Min SDK 26 (Android 8.0 to Android 15)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Single command build: <code className="font-mono text-amber-300">./gradlew assembleRelease</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Includes complete sideloading & APK installation guide</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <button
              onClick={handleDownloadApkPackage}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download Android APK Package
            </button>
          </div>
        </div>
      </div>

      {/* Sideloading Instructions */}
      <div className="bg-[#0b0c16] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Android APK Sideloading Instructions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-300">
          <div className="bg-[#121422] p-4 rounded-xl border border-zinc-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs mb-2">
              1
            </span>
            <strong className="text-zinc-100 block">Enable Unknown Sources</strong>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              On your Android phone, go to <strong>Settings &gt; Security &gt; Install Unknown Apps</strong>, and enable permission for your browser or file manager.
            </p>
          </div>

          <div className="bg-[#121422] p-4 rounded-xl border border-zinc-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs mb-2">
              2
            </span>
            <strong className="text-zinc-100 block">Download / Transfer APK</strong>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Download the APK directly to your device or transfer via USB cable to your phone's internal storage or SD card.
            </p>
          </div>

          <div className="bg-[#121422] p-4 rounded-xl border border-zinc-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs mb-2">
              3
            </span>
            <strong className="text-zinc-100 block">Tap & Install</strong>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Open your Android <strong>Files</strong> app, tap the APK file, and confirm <strong>Install</strong>. GS Edit AI is ready to use!
            </p>
          </div>
        </div>
      </div>

      {/* Android Hardware Spec & Verification */}
      <div className="bg-[#0b0c16] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Android Engine Compatibility & Diagnostics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#121422] p-3 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 text-[10px] block">PWA Manifest:</span>
            <strong className="text-emerald-400">Compliant (24fps 8K)</strong>
          </div>
          <div className="bg-[#121422] p-3 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 text-[10px] block">Hardware Acceleration:</span>
            <strong className="text-emerald-400">WebGL & Canvas 2D</strong>
          </div>
          <div className="bg-[#121422] p-3 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 text-[10px] block">MP4 Muxer:</span>
            <strong className="text-cyan-400">Active (MPEG-4 AVC)</strong>
          </div>
          <div className="bg-[#121422] p-3 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 text-[10px] block">Owner Auth:</span>
            <strong className="text-amber-400">Enforced Server-Side</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
