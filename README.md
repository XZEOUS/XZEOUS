# XZEOUS × ROXY — Android Studio project

A native Android starter app built with Kotlin + Jetpack Compose. Includes:
- Calculator with parentheses, powers, pi/e, trig (degrees), sqrt, abs, log and ln
- Local calculation history (SharedPreferences)
- Length, weight and temperature conversion
- Discount, tip, bill split, percentage and percent-change tools
- Three selectable accent themes

## Open and build
1. Install Android Studio and a JDK 17.
2. Open this folder (`XZEOUS_ROXY_Android`) in Android Studio.
3. Let Gradle sync. If prompted, install Android SDK Platform 35 and Build Tools.
4. Run on an emulator or Android phone with USB debugging enabled.
5. To create an APK: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

The app does not require network access. Currency conversion is intentionally not included until a reliable live-rate source is configured. The ROXY label is an in-app helper identity; cloud AI chat is not connected in this starter version.
