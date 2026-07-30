# OEM Unlock Helper (Android companion app)

⚠️ **This was written and reviewed carefully, but never actually compiled.**
The sandbox this was built in has Java 21 and Gradle, but no Android SDK —
there's no way to run a real Android build there. This code follows
Shizuku's documented public API as closely as possible, but you're the
first real build it will go through. Open it in Android Studio, let it
sync, and fix anything that doesn't compile against whatever Shizuku/AGP
versions are current when you build — don't assume it's been tested,
because it hasn't.

## What this is

A small companion to the main toolkit's `npm start` wizard. Instead of
manually navigating Settings > Wi-Fi > Modify network > Advanced to point
your phone's proxy at your computer, this app uses
[Shizuku](https://shizuku.rikka.app/) (ADB-shell-level privilege, granted
once, no PC needed after that) to run the same command with a tap.

It also includes a diagnostic check for whether your device would allow a
certificate to be trusted at the system level — relevant to the
`SSLV3_ALERT_CERTIFICATE_UNKNOWN` failure mode documented in
`../commonissues.md`. **It only checks and reports — it does not install
a certificate.** See "Why no system cert install" below for why.

## Building it

1. Install [Android Studio](https://developer.android.com/studio)
2. File > Open, point it at this `android-helper/` directory
3. Let Gradle sync (it will pull the Android Gradle Plugin, Kotlin plugin,
   and the Shizuku SDK from Google's/Maven Central — needs a real internet
   connection, unlike the rest of this repo)
4. If the pinned `dev.rikka.shizuku:api`/`:provider` version in
   `app/build.gradle.kts` has aged out, bump it to whatever's current on
   [Shizuku-API's releases](https://github.com/RikkaApps/Shizuku-API)
5. Build > Make Project, then run it on a device with
   [Shizuku](https://shizuku.rikka.app/) already installed and its service
   started (via `adb shell sh /sdcard/Android/data/moe.shizuku.privileged.api/start.sh`,
   wireless debugging pairing on Android 11+, or root)

## Using it

1. Open the app — it checks whether Shizuku is running and whether this
   app has permission
2. Tap **Request Shizuku Permission** if it isn't granted yet
3. Enter your computer's LAN IP (same one `npm start` shows you) and the
   port (`8080` by default)
4. Tap **Set Proxy** — this runs
   `settings put global http_proxy <host>:<port>` for you
5. When you're done, tap **Clear Proxy** to restore normal networking
   (`settings put global http_proxy :0`)

## Why no system cert install

Shizuku grants **shell-level** privilege (roughly what `adb shell` gives
you without a PC) — not root. `/system`, where a system-trusted
certificate would need to live, is read-only and protected by
dm-verity/AVB on any device with a locked bootloader. That describes every
device this toolkit targets — if the bootloader were already unlocked,
you wouldn't need any of this. Shell-level access generally cannot remount
or write to `/system` on such a device; only actual root (Magisk, which
itself typically needs an unlocked bootloader to install) can.

The **Check System Write Access** button runs a harmless read-only probe
(`id`, `test -w /system`) and reports the plain result. If it says writes
are allowed on your specific device, follow the manual steps in
`../commonissues.md` to finish the cert install by hand — this app
deliberately doesn't attempt that part itself. Placing a certificate
correctly into the system trust store means the exact right filename
(an OpenSSL subject-hash), correct permissions, and a clean remount
sequence; getting that subtly wrong in code that's never run against a
real device is worse than not offering it, so it's left as a documented
manual step for now rather than an unverified automated one.

## How this fits into the rest of the repo

This is a separate sub-project with its own toolchain (Kotlin/Gradle/
Android SDK) — it does not go through `../build.js` or `npm test`, and
nothing in `../src/core` depends on it. See `../ARCHITECTURE.md` for how
it relates to everything else.
