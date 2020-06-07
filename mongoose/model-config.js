"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newMongooseInstance = exports.sbaseMongooseConfig = exports.DEFAULT_MONGOOSE_MULTI_TENANCY_OPTIONS = void 0;
const _ = require("underscore");
const mongoose_1 = require("mongoose");
exports.DEFAULT_MONGOOSE_MULTI_TENANCY_OPTIONS = {
    enabled: false,
    defaultCollectionNamespace: '',
    tenants: [],
    tenancyFn: () => 'default',
    options: {},
    onError: () => { },
    onMongooseInstanceCreated: () => { },
};
exports.sbaseMongooseConfig = {
    multiTenancy: _.clone(exports.DEFAULT_MONGOOSE_MULTI_TENANCY_OPTIONS),
};
function newMongooseInstance(sbaseConfig) {
    const mongoose = new mongoose_1.Mongoose();
    mongoose.sbaseConfig = sbaseConfig;
    return mongoose;
}
exports.newMongooseInstance = newMongooseInstance;

//# sourceMappingURL=model-config.js.map
