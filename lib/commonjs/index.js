"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _debugProvider = require("./components/debug/debug-provider");
Object.keys(_debugProvider).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _debugProvider[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _debugProvider[key];
    }
  });
});
//# sourceMappingURL=index.js.map