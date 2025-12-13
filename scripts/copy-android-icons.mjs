#!/usr/bin/env node

import { execa } from 'execa';
import { copyFile, mkdir, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function ensureDirectoryExists(path) {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function copyAndroidIcons() {
  try {
    console.log('🚀 Starting Android icon automation...');

    // Step 1: Create assets directory
    const assetsDir = join(__dirname, '..', 'assets');
    await ensureDirectoryExists(assetsDir);
    console.log(`✅ Created assets directory: ${assetsDir}`);

    // Step 2: Find the largest Android icon to use as source
    const androidIconsDir = join(__dirname, '..', 'public', 'android');
    const files = await readdir(androidIconsDir);

    let sourceIcon = null;
    let maxSize = 0;

    for (const file of files) {
      if (file.startsWith('android-launchericon-') && file.endsWith('.png')) {
        const sizeMatch = file.match(/android-launchericon-(\d+)-(\d+)\.png/);
        if (sizeMatch) {
          const size = parseInt(sizeMatch[1]);
          if (size > maxSize) {
            maxSize = size;
            sourceIcon = join(androidIconsDir, file);
          }
        }
      }
    }

    if (!sourceIcon) {
      throw new Error('No suitable Android icon found in public/android/');
    }

    console.log(`📁 Found source icon: ${sourceIcon} (${maxSize}x${maxSize})`);

    // Step 3: Copy the largest icon as icon-only.png for Capacitor assets
    const targetIcon = join(assetsDir, 'icon-only.png');
    await copyFile(sourceIcon, targetIcon);
    console.log(`✅ Copied icon to: ${targetIcon}`);

    // Step 4: Run capacitor-assets generate for Android
    console.log('🔧 Generating Android assets with @capacitor/assets...');
    await execa('npx', ['capacitor-assets', 'generate', '--android'], {
      stdio: 'inherit',
      cwd: __dirname.replace('/scripts', '')
    });

    console.log('✅ Android icon automation completed successfully!');

  } catch (error) {
    console.error('❌ Error during Android icon automation:', error);
    process.exit(1);
  }
}

// Run the script
copyAndroidIcons();
