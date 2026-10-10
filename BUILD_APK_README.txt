XZEOUS × ROXY — Build a real APK on Windows

Why this helper exists
The provided project uses Kotlin + Jetpack Compose and needs Android SDK Platform 35 plus Gradle dependencies. The ChatGPT execution container has Java but has no Android SDK, no Gradle distribution/wrapper, and cannot resolve external hosts, so it cannot produce a genuine APK itself. This script builds the original app on a Windows PC with network access, without changing the application source.

Steps
1. Install Android Studio from https://developer.android.com/studio
2. Open Android Studio > Tools > SDK Manager.
3. Install Android SDK Platform 35 and the latest Android SDK Build-Tools available for it.
4. Ensure a JDK 17+ is available (Android Studio's bundled JBR is suitable; if needed set JAVA_HOME to that JBR path).
5. Extract this project ZIP.
6. Open PowerShell in the extracted XZEOUS_ROXY_Android folder and run:
   Set-ExecutionPolicy -Scope Process Bypass
   .\build-apk.ps1
7. Allow Gradle to download its official distribution and project dependencies.

Expected output files
  app\build\outputs\apk\debug\app-debug.apk
  XZEOUS_ROXY.apk

The generated APK is a debug build. It can be installed on an Android device. It is not a Play Store release-signed APK.

Notes
- The script writes local.properties for the detected SDK and creates Gradle Wrapper files if absent.
- It does not upload the source code or ask for private signing keys.
- ROXY cloud AI chat and live currency conversion are not connected in this starter project, as the source README states.
