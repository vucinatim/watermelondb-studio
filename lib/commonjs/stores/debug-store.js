"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useDebugStore = void 0;
var _asyncStorage = _interopRequireDefault(require("@react-native-async-storage/async-storage"));
var _zustand = require("zustand");
var _middleware = require("zustand/middleware");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const useDebugStore = exports.useDebugStore = (0, _zustand.create)()((0, _middleware.persist)(set => ({
  isDbServerEnabled: true,
  // Default to true
  toggleDbServer: () => set(state => ({
    isDbServerEnabled: !state.isDbServerEnabled
  }))
}), {
  name: 'debug-storage',
  storage: (0, _middleware.createJSONStorage)(() => _asyncStorage.default)
}));
//# sourceMappingURL=debug-store.js.map