# Android Icon Automation

## Overview
This document describes the automated process for transferring Android icons from the public directory to the Android build using @capacitor/assets.

## Automation Script
Location: `scripts/copy-android-icons.mjs`

## How It Works
1. **Source Icons**: The script automatically finds Android icons in `public/android/` directory
2. **Selection**: It selects the largest icon (512x512) as the source for @capacitor/assets
3. **Processing**: Uses @capacitor/assets to generate all required Android icon sizes and formats
4. **Output**: Generates icons in the appropriate Android resource directories:
   - `android/app/src/main/res/mipmap-ldpi/`
   - `android/app/src/main/res/mipmap-mdpi/`
   - `android/app/src/main/res/mipmap-hdpi/`
   - `android/app/src/main/res/mipmap-xhdpi/`
   - `android/app/src/main/res/mipmap-xxhdpi/`
   - `android/app/src/main/res/mipmap-xxxhdpi/`

## Generated Files
The automation creates both regular and round icons for all screen densities:
- `ic_launcher.png` - Regular app icons
- `ic_launcher_round.png` - Round app icons (for devices that support them)

## Usage
Run the automation with:
```bash
npm run android:icons
```

## Requirements
- @capacitor/assets package (installed as dev dependency)
- Source icons must be in PNG format and follow the naming pattern: `android-launchericon-*-*.png`

## Benefits
- Automates the tedious process of manually copying and resizing icons
- Ensures consistency across all Android screen densities
- Follows Android best practices for adaptive icons
- Integrates seamlessly with the Capacitor build process

## Technical Details
The script uses the largest available icon (512x512) as the source and lets @capacitor/assets handle the resizing and optimization for different screen densities, ensuring optimal quality and performance.
