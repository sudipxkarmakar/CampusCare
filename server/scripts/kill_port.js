
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PORT = 5000;

const killPort = async () => {
    try {
        const isWindows = process.platform === 'win32';

        if (!isWindows) {
            console.log('⚠️  Auto-kill script designed for Windows. Skipping...');
            return;
        }

        // Find PID occupying the port
        const { stdout } = await execAsync(`netstat -ano | findstr :${PORT}`);

        if (!stdout) {
            console.log(`✅ Port ${PORT} is free.`);
            return;
        }

        const lines = stdout.trim().split('\n');
        // Take the last line which usually contains the listening process
        const line = lines[lines.length - 1].trim();
        const parts = line.split(/\s+/);
        const pid = parts[parts.length - 1];

        if (pid && pid !== '0') {
            console.log(`⚠️  Port ${PORT} is busy (PID: ${pid}). Killing process...`);
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`✅ Process ${pid} terminated. Port ${PORT} is now free.`);
        }

    } catch (error) {
        if (error.cmd && error.cmd.includes('netstat')) {
            console.log(`✅ Port ${PORT} is free.`);
        } else {
            console.warn(`⚠️  Could not check/kill port ${PORT}: ${error.message}`);
        }
    }
};

killPort();
