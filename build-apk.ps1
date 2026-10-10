$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host '=== XZEOUS x ROXY APK Builder ===' -ForegroundColor Cyan

# Find a usable JDK. AGP 8.10.1 requires JDK 17 or newer.
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if (-not $javaCmd) { throw 'Java 17+ is required. Install Android Studio (recommended) or a JDK, then rerun this script.' }
} else {
    $env:PATH = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:PATH
}

# Locate Android SDK from environment variables or common Android Studio paths.
$sdkCandidates = @()
if ($env:ANDROID_SDK_ROOT) { $sdkCandidates += $env:ANDROID_SDK_ROOT }
if ($env:ANDROID_HOME) { $sdkCandidates += $env:ANDROID_HOME }
if ($env:LOCALAPPDATA) {
    $sdkCandidates += (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
    $sdkCandidates += (Join-Path $env:LOCALAPPDATA 'Android\sdk')
}
$sdk = $sdkCandidates | Where-Object { $_ -and (Test-Path (Join-Path $_ 'platforms\android-35\android.jar')) } | Select-Object -First 1
if (-not $sdk) {
    throw "Android SDK Platform 35 was not found. Open Android Studio > Tools > SDK Manager, install Android SDK Platform 35 and Android SDK Build-Tools, then rerun this script."
}
$env:ANDROID_SDK_ROOT = $sdk
$env:ANDROID_HOME = $sdk
$sdkPathForProperties = $sdk.Replace('\', '\\').Replace(':', '\:')
Set-Content -Path (Join-Path $ProjectRoot 'local.properties') -Value "sdk.dir=$sdkPathForProperties" -Encoding ASCII

# Bootstrap Gradle 8.11.1 if this project has no wrapper and Gradle is not installed.
$gradleCmd = Get-Command gradle -ErrorAction SilentlyContinue
if (-not $gradleCmd) {
    $toolsDir = Join-Path $env:LOCALAPPDATA 'XZEOUS-build-tools'
    $gradleHome = Join-Path $toolsDir 'gradle-8.11.1'
    $gradleZip = Join-Path $toolsDir 'gradle-8.11.1-bin.zip'
    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
    if (-not (Test-Path (Join-Path $gradleHome 'bin\gradle.bat'))) {
        Write-Host 'Downloading Gradle 8.11.1 from the official Gradle distribution host...' -ForegroundColor Yellow
        Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.11.1-bin.zip' -OutFile $gradleZip
        Expand-Archive -Path $gradleZip -DestinationPath $toolsDir -Force
    }
    $gradleExe = Join-Path $gradleHome 'bin\gradle.bat'
} else {
    $gradleExe = $gradleCmd.Source
}

# Create a project wrapper when absent, then build the debug APK.
if (-not (Test-Path (Join-Path $ProjectRoot 'gradlew.bat'))) {
    & $gradleExe wrapper --gradle-version 8.11.1
    if ($LASTEXITCODE -ne 0) { throw "Gradle wrapper generation failed with exit code $LASTEXITCODE." }
}
& (Join-Path $ProjectRoot 'gradlew.bat') --no-daemon assembleDebug
if ($LASTEXITCODE -ne 0) { throw "assembleDebug failed with exit code $LASTEXITCODE. See the Gradle error output above." }

$builtApk = Join-Path $ProjectRoot 'app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $builtApk) -or (Get-Item $builtApk).Length -le 0) { throw 'Gradle reported success, but the expected APK was not found or is empty.' }
$deliverable = Join-Path $ProjectRoot 'XZEOUS_ROXY.apk'
Copy-Item -Path $builtApk -Destination $deliverable -Force
Write-Host "APK successfully built: $deliverable" -ForegroundColor Green
Write-Host "Debug output: $builtApk"
Write-Host 'Package: com.xzeous.roxy | version: 1.0 | minSdk: 26 | targetSdk: 35'

# Verify APK with Android SDK build-tools when available.
$apksigner = Get-ChildItem -Path (Join-Path $sdk 'build-tools') -Filter apksigner.bat -Recurse -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
if ($apksigner) {
    & $apksigner.FullName verify --verbose $deliverable
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
} else {
    Write-Warning 'apksigner was not found; APK existence was checked but signature verification was skipped.'
}
