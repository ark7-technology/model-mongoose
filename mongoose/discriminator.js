"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Discriminator = void 0;
const _ = require("underscore");
const model_1 = require("./model");
class Discriminator extends model_1.DocumentModel {
    static $discriminator(m) {
        return discriminatorMultiTenancy(this, m);
    }
    static $discriminatorA7Model(m) {
        return this.$discriminator(m);
    }
}
exports.Discriminator = Discriminator;
function discriminatorMultiTenancy(model, dm) {
    const sbaseConfig = model.sbaseConfig;
    if (!sbaseConfig.multiTenancy.enabled) {
        const m = model.discriminator(dm.name, dm.$mongooseOptions().mongooseSchema);
        m.sbaseConfig = sbaseConfig;
        return m;
    }
    const tenants = ['default'].concat(sbaseConfig.multiTenancy.tenants);
    const tenantMap = {};
    const currentTenantMap = model._proxy.$tenantMap;
    for (const tenancy of tenants) {
        const m = currentTenantMap[tenancy].discriminator(dm.name, dm.$mongooseOptions(sbaseConfig, tenancy).mongooseSchema);
        m.sbaseConfig = sbaseConfig;
        tenantMap[tenancy] = m;
    }
    const proxy = new Proxy({}, {
        get: (_obj, prop) => {
            if (model_1.lazyFns.indexOf(prop) >= 0) {
                const ret = function () {
                    const t = sbaseConfig.multiTenancy.tenancyFn(prop);
                    const m1 = tenantMap[t];
                    const actualFn = m1[prop];
                    return actualFn.apply(this, arguments);
                };
                return ret;
            }
            if (model_1.shareFns.indexOf(prop) >= 0) {
                const ret = () => {
                    return _.map(tenants, (t) => {
                        const m2 = tenantMap[t];
                        return m2[prop].apply(m2, arguments);
                    });
                };
                return ret;
            }
            const tenancy = sbaseConfig.multiTenancy.tenancyFn(prop);
            const m = tenantMap[tenancy];
            m._proxy = proxy;
            if (prop === '$modelClass') {
                return m;
            }
            const res = m[prop];
            return _.isFunction(res) ? res.bind(m) : res;
        },
        set: (_obj, prop, value) => {
            const tenancy = sbaseConfig.multiTenancy.tenancyFn(prop);
            const m = tenantMap[tenancy];
            m[prop] = value;
            return true;
        },
    });
    return proxy;
}

//# sourceMappingURL=discriminator.js.map
