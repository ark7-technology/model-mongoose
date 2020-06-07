"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendMetadata = exports.pushMetadata = void 0;
const _ = require("underscore");
function pushMetadata(key, target, ...metadataValue) {
    const meta = Reflect.getOwnMetadata(key, target) || [];
    meta.push(...metadataValue);
    Reflect.defineMetadata(key, meta, target);
    return meta;
}
exports.pushMetadata = pushMetadata;
function extendMetadata(key, target, ...metadataValue) {
    const meta = Reflect.getOwnMetadata(key, target) || {};
    _.extend(meta, ...metadataValue);
    Reflect.defineMetadata(key, meta, target);
    return meta;
}
exports.extendMetadata = extendMetadata;

//# sourceMappingURL=helpers.js.map
