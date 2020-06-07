"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.libName = void 0;
exports.libName = 'ark-db';
__exportStar(require("./a7-model"), exports);
__exportStar(require("./data-level"), exports);
__exportStar(require("./discriminator"), exports);
__exportStar(require("./model-config"), exports);
__exportStar(require("./model"), exports);
__exportStar(require("./soft-delete"), exports);
__exportStar(require("./timestamp"), exports);
__exportStar(require("./types"), exports);

//# sourceMappingURL=index.js.map
