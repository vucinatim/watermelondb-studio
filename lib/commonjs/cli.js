#!/usr/bin/env node
"use strict";

var _child_process = require("child_process");
var _path = _interopRequireDefault(require("path"));
var _url = require("url");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// ES module equivalent of __dirname
const _filename = (0, _url.fileURLToPath)(import.meta.url);
const _dirname = _path.default.dirname(_filename);
const cli = () => {
  // Path to the viewer/dist directory, which is inside our package
  const viewerDistPath = _path.default.resolve(_dirname, '..', '..', 'viewer', 'dist');
  console.log('Starting WatermelonDB Studio viewer...');
  console.log(`Serving static files from: ${viewerDistPath}`);

  // Use `npx` to find and execute the `serve` command from node_modules
  const command = `npx serve -s "${viewerDistPath}" -l 3000`;
  const child = (0, _child_process.exec)(command);

  // Pipe the output of the child process to the main process
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
  child.on('close', code => {
    console.log(`\nViewer server process exited with code ${code}`);
  });
};
cli();
//# sourceMappingURL=cli.js.map