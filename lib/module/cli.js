#!/usr/bin/env node
"use strict";

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cli = () => {
  // Path to the viewer/dist directory, which is inside our package
  const viewerDistPath = path.resolve(__dirname, '..', '..', 'viewer', 'dist');
  console.log('Starting WatermelonDB Studio viewer...');
  console.log(`Serving static files from: ${viewerDistPath}`);

  // Use `npx` to find and execute the `serve` command from node_modules
  const command = `npx serve -s "${viewerDistPath}" -l 3000`;
  const child = exec(command);

  // Pipe the output of the child process to the main process
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
  child.on('close', code => {
    console.log(`\nViewer server process exited with code ${code}`);
  });
};
cli();
//# sourceMappingURL=cli.js.map