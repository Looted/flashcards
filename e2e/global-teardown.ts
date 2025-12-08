import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalTeardown(config: FullConfig) {
  console.log('[TEARDOWN] Starting global teardown...');

  // Playwright's webServer should handle cleanup automatically,
  // but we'll add extra cleanup to ensure no processes are left hanging

  try {
    const isEmulatorManagedExternally = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
    if (isEmulatorManagedExternally) {
      console.log('[TEARDOWN] Emulators are managed externally (e.g. by firebase emulators:exec), skipping forced kill of ports 9099/8080.');
    } else {
      console.log('[TEARDOWN] Checking for Firebase emulator processes...');
    }

    if (process.platform === 'win32') {
      // Windows: Kill processes by port

      if (!isEmulatorManagedExternally) {
        try {
          await execAsync('netstat -ano | findstr :9099');
          console.log('[TEARDOWN] Found process on port 9099, attempting to kill...');
          // Get PID and kill it
          const { stdout } = await execAsync('netstat -ano | findstr :9099');
          const lines = stdout.split('\n').filter(l => l.trim());
          for (const line of lines) {
            // Extract PID from end of line (last column)
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && !isNaN(Number(pid))) {
              console.log(`[TEARDOWN] Killing process ${pid} on port 9099`);
              await execAsync(`taskkill /F /PID ${pid}`).catch(() => {
                console.log(`[TEARDOWN] Could not kill PID ${pid}, may already be stopped`);
              });
            }
          }
        } catch (e) {
          console.log('[TEARDOWN] No process found on port 9099');
        }
      }

      // Kill Angular dev server on port 4200 - always try to clean this up
      try {
        await execAsync('netstat -ano | findstr :4200');
        console.log('[TEARDOWN] Found process on port 4200, attempting to kill...');
        const { stdout } = await execAsync('netstat -ano | findstr :4200');
        const lines = stdout.split('\n').filter(l => l.trim());
        for (const line of lines) {
          // Extract PID from end of line (last column)
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && !isNaN(Number(pid))) {
            console.log(`[TEARDOWN] Killing process ${pid} on port 4200`);
            await execAsync(`taskkill /F /PID ${pid}`).catch(() => {
              console.log(`[TEARDOWN] Could not kill PID ${pid}, may already be stopped`);
            });
          }
        }
      } catch (e) {
        console.log('[TEARDOWN] No process found on port 4200');
      }

      if (!isEmulatorManagedExternally) {
        // Kill Firestore emulator on port 8080
        try {
          await execAsync('netstat -ano | findstr :8080');
          console.log('[TEARDOWN] Found process on port 8080, attempting to kill...');
          const { stdout } = await execAsync('netstat -ano | findstr :8080');
          const lines = stdout.split('\n').filter(l => l.trim());
          for (const line of lines) {
            // Extract PID from end of line (last column)
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && !isNaN(Number(pid))) {
              console.log(`[TEARDOWN] Killing process ${pid} on port 8080`);
              await execAsync(`taskkill /F /PID ${pid}`).catch(() => {
                console.log(`[TEARDOWN] Could not kill PID ${pid}, may already be stopped`);
              });
            }
          }
        } catch (e) {
          console.log('[TEARDOWN] No process found on port 8080');
        }
      }
    } else {
      // Unix-like systems
      try {
        if (!isEmulatorManagedExternally) {
          await execAsync('lsof -ti:9099 | xargs kill -9').catch(() => {
            console.log('[TEARDOWN] No process found on port 9099');
          });
        }
        await execAsync('lsof -ti:4200 | xargs kill -9').catch(() => {
          console.log('[TEARDOWN] No process found on port 4200');
        });
      } catch (e) {
        console.log('[TEARDOWN] Error killing processes on Unix:', e);
      }
    }

    console.log('[TEARDOWN] ✓ Cleanup complete');
  } catch (error) {
    console.error('[TEARDOWN] Error during teardown:', error);
    // Don't throw - we want teardown to complete even if cleanup fails
  }
}

export default globalTeardown;
