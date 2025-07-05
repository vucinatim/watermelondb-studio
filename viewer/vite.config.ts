import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { exec } from 'node:child_process'; // Import Node.js's tool for running commands
import path from 'node:path';
import { defineConfig } from 'vite';

// --- Our custom ADB plugin ---
const adbForwarderPlugin = () => ({
  name: 'adb-forwarder',
  configureServer() {
    const MAC_PORT = 12345;
    const PHONE_PORT = 12345;
    const adbRule = `tcp:${MAC_PORT} tcp:${PHONE_PORT}`;

    // Function to set the rule
    const setForwardRule = () => {
      console.log(`🔌 Setting ADB forward rule: ${adbRule}...`);
      exec(`adb forward ${adbRule}`, (err, _, stderr) => {
        if (err) {
          console.error(`❌ Failed to set ADB forward rule: ${stderr}`);
        } else {
          console.log(`✅ ADB forward rule set successfully.`);
        }
      });
    };

    // Check for existing rules first
    exec('adb forward --list', (err, stdout) => {
      if (err) {
        console.error(
          `❌ ADB command failed. Is ADB installed and in your PATH?`,
        );
        return;
      }

      if (stdout.includes(adbRule)) {
        console.log(`✅ ADB forward rule already exists: ${adbRule}`);
      } else {
        // If the rule doesn't exist, set it
        setForwardRule();
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    adbForwarderPlugin(), // <-- Add our custom plugin here
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
