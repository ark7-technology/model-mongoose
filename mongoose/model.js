"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineValidator = exports.preQueries = exports.NativeError = exports.UpdateValidator = exports.Index = exports.Posts = exports.Post = exports.Virtual = exports.Pres = exports.Pre = exports.Plugin = exports.Config = exports.Mixin = exports.Field = exports.Validate = exports.Optional = exports.MapField = exports.Default = exports.Unique = exports.IndexField = exports.Required = exports.ArrayField = exports.DBRefArray = exports.DBRef = exports.Enum = exports.DocumentModel = exports.shareFns = exports.lazyFns = exports.Model = void 0;
require("reflect-metadata");
const _ = require("underscore");
const debug_1 = require("debug");
const mongoose_1 = require("mongoose");
const model_config_1 = require("./model-config");
const helpers_1 = require("./helpers");
const d = debug_1.default('sbase:model');
/**
 * Wrapped Model from mongoose.Model.
 */
class Model {
    static modelize(o) {
        const p = {
            toJSON() {
                return this;
            },
        };
        Object.setPrototypeOf(o, p);
        Object.setPrototypeOf(p, this.prototype);
        return o;
    }
    static Schema(schema) {
        helpers_1.extendMetadata(SCHEMA_KEY, this.prototype, schema);
        return this;
    }
    static Config(config) {
        helpers_1.extendMetadata(CONFIG_KEY, this.prototype, config);
        return this;
    }
    static Pre(pre) {
        helpers_1.pushMetadata(PRE_KEY, this.prototype, pre);
        return this;
    }
    static Post(post) {
        helpers_1.pushMetadata(POST_KEY, this.prototype, post);
        return this;
    }
    static Virtual(virtual) {
        helpers_1.pushMetadata(VIRTUAL_KEY, this.prototype, virtual);
        return this;
    }
    static Plugin(plugin) {
        helpers_1.pushMetadata(PLUGIN_KEY, this.prototype, plugin);
        return this;
    }
    static Index(index) {
        helpers_1.pushMetadata(INDEX_KEY, this.prototype, index);
        return this;
    }
    static Mixin(model) {
        helpers_1.pushMetadata(MIXIN_KEY, this.prototype, model);
        return this;
    }
    static UpdateValidator(validate) {
        helpers_1.pushMetadata(UPDATE_VALIDATOR_KEY, this.prototype, validate);
        return this;
    }
    static $mongooseOptions(sbaseConfig, tenancy = 'default') {
        if (this === Model) {
            return null;
        }
        d('generate $mongooseOptions for %O', this.name);
        let mongooseOptionsMap = Reflect.getOwnMetadata(MONGOOSE_OPTIONS_KEY, this.prototype);
        if (mongooseOptionsMap && mongooseOptionsMap[tenancy]) {
            return mongooseOptionsMap[tenancy];
        }
        const mongooseOptions = {};
        mongooseOptionsMap = {
            [tenancy]: mongooseOptions,
        };
        Reflect.defineMetadata(MONGOOSE_OPTIONS_KEY, mongooseOptionsMap, this.prototype);
        const superClass = this.__proto__;
        const superOptions = superClass.$mongooseOptions(sbaseConfig, tenancy) || {};
        const mixinModels = _.union(Reflect.getOwnMetadata(MIXIN_KEY, this.prototype) || []);
        const mixinOptions = _.map(mixinModels, (model) => model.$mongooseOptions(sbaseConfig, tenancy));
        const schemas = _.flatten([
            _.map(mixinOptions, (opt) => opt.schema),
            superOptions.schema,
            Reflect.getOwnMetadata(SCHEMA_KEY, this.prototype),
        ]);
        mongooseOptions.schema = _.extend({}, ...schemas);
        const configs = _.flatten([
            _.map(mixinOptions, (opt) => opt.config),
            superOptions.config,
            Reflect.getOwnMetadata(CONFIG_KEY, this.prototype),
        ]);
        mongooseOptions.config = _.extend({}, ...configs);
        mongooseOptions.pres = _.filter(_.union(_.flatten([
            _.map(mixinOptions, (opt) => opt.pres),
            superOptions.pres,
            Reflect.getOwnMetadata(PRE_KEY, this.prototype),
        ])), (x) => !!x);
        mongooseOptions.posts = _.filter(_.union(_.flatten([
            _.map(mixinOptions, (opt) => opt.posts),
            superOptions.posts,
            Reflect.getOwnMetadata(POST_KEY, this.prototype),
        ])), (x) => !!x);
        mongooseOptions.virtuals = _.filter(_.union(_.flatten([
            _.map(mixinOptions, (opt) => opt.virtuals),
            superOptions.virtuals,
            Reflect.getOwnMetadata(VIRTUAL_KEY, this.prototype),
        ])), (x) => !!x);
        mongooseOptions.updateValidators = _.filter(_.union(_.flatten([
            _.map(mixinOptions, (opt) => opt.updateValidators),
            superOptions.updateValidators,
            Reflect.getOwnMetadata(UPDATE_VALIDATOR_KEY, this.prototype),
        ])), (x) => !!x);
        mongooseOptions.plugins = _.sortBy(_.filter(_.union(_.flatten([
            _.map(mixinOptions, (opt) => opt.plugins),
            superOptions.plugins,
            Reflect.getOwnMetadata(PLUGIN_KEY, this.prototype),
        ])), (x) => !!x), (plugin) => plugin.priority);
        mongooseOptions.indexes = _.filter(_.union(_.flatten([
            _.map(mixinOptions, (opt) => opt.indexes),
            superOptions.indexes,
            Reflect.getOwnMetadata(INDEX_KEY, this.prototype),
        ])), (x) => !!x);
        mongooseOptions.methods = _.filter(_.union(_.flatten([
            _.map(mixinOptions, (opt) => opt.methods),
            superOptions.methods,
        ])), (x) => !!x);
        mongooseOptions.statics = _.filter(_.union(_.flatten([
            _.map(mixinOptions, (opt) => opt.statics),
            superOptions.statics,
        ])), (x) => !!x);
        for (const name of Object.getOwnPropertyNames(this.prototype)) {
            if (name === 'constructor') {
                continue;
            }
            const descriptor = Object.getOwnPropertyDescriptor(this.prototype, name);
            if (descriptor.value && _.isFunction(descriptor.value)) {
                mongooseOptions.methods.push({ name, fn: descriptor.value });
            }
            if (descriptor.get || descriptor.set) {
                mongooseOptions.virtuals.push({
                    name,
                    get: descriptor.get,
                    set: descriptor.set,
                });
            }
        }
        for (const name of Object.getOwnPropertyNames(this)) {
            const descriptor = Object.getOwnPropertyDescriptor(this, name);
            if (STATIC_FILTER_NAMES.indexOf(name) >= 0) {
                continue;
            }
            if (descriptor.value) {
                mongooseOptions.statics.push({ name, fn: descriptor.value });
            }
        }
        const collection = sbaseConfig != null && mongooseOptions.config.collection
            ? _.chain([
                tenancy === 'default'
                    ? sbaseConfig.multiTenancy.defaultCollectionNamespace
                    : tenancy,
                mongooseOptions.config.collection,
            ])
                .filter((x) => !!x)
                .join('.')
                .value()
            : mongooseOptions.config.collection;
        const mongooseSchema = new mongoose_1.Schema(mongooseOptions.schema, _.extend(_.clone(mongooseOptions.config), { collection }));
        mongooseSchema.parentSchema = superOptions.mongooseSchema;
        for (const pre of mongooseOptions.pres) {
            d('create pre for %O with name %O and options %O', this.name, pre.name, pre);
            pre.parallel = pre.parallel || false;
            mongooseSchema.pre(pre.name, pre.parallel, pre.fn, pre.errorCb);
        }
        for (const post of mongooseOptions.posts) {
            d('create post for %O with name %O and options %O', this.name, post.name, post);
            mongooseSchema.post(post.name, post.fn);
        }
        for (const virtual of mongooseOptions.virtuals) {
            d('create virtual for %O with name %O and options %O', this.name, virtual.name, virtual.options);
            let v = mongooseSchema.virtual(virtual.name, virtual.options);
            if (virtual.get) {
                v = v.get(virtual.get);
            }
            if (virtual.set) {
                v = v.set(virtual.set);
            }
        }
        for (const method of mongooseOptions.methods) {
            d('create method for %O with name %O and function %O', this.name, method.name, method.fn);
            mongooseSchema.methods[method.name] = method.fn;
        }
        for (const method of mongooseOptions.statics) {
            mongooseSchema.statics[method.name] = method.fn;
        }
        for (const plugin of mongooseOptions.plugins) {
            const options = _.extend({}, mongooseOptions.config, plugin.options);
            mongooseSchema.plugin(plugin.fn, options);
        }
        for (const index of mongooseOptions.indexes) {
            d('create index for %O with fields %O and options %O', this.name, index.fields, index.options);
            mongooseSchema.index(index.fields, index.options);
        }
        for (const validate of mongooseOptions.updateValidators) {
            mongooseSchema
                .path(validate.path)
                .validate(combineValidator(validate.fn), validate.errorMsg, validate.type);
        }
        mongooseOptions.mongooseSchema = mongooseSchema;
        return mongooseOptions;
    }
    static $register(mongooseInstance) {
        return registerMultiTenancy(this, mongooseInstance);
    }
    static $registerA7Model(mongooseInstance) {
        return registerMultiTenancy(this, mongooseInstance);
    }
}
exports.Model = Model;
const mongooseInstanceMap = {};
exports.lazyFns = [];
exports.shareFns = ['on'];
function registerMultiTenancy(model, mongooseInstance) {
    if (!mongooseInstance) {
        mongooseInstance = require('mongoose');
        mongooseInstance.sbaseConfig = model_config_1.sbaseMongooseConfig;
    }
    const sbaseConfig = mongooseInstance
        .sbaseConfig;
    if (!sbaseConfig.multiTenancy.enabled) {
        const m = mongooseInstance.model(model.name, model.$mongooseOptions().mongooseSchema);
        m.sbaseConfig = sbaseConfig;
        return m;
    }
    const tenants = ['default'].concat(sbaseConfig.multiTenancy.tenants);
    const tenantMap = {};
    for (const tenancy of tenants) {
        let mi = mongooseInstanceMap[tenancy];
        if (mi == null) {
            mi = new mongoose_1.Mongoose();
            mi.connect(sbaseConfig.multiTenancy.uris, sbaseConfig.multiTenancy.options, (err) => {
                sbaseConfig.multiTenancy.onError(err, tenancy);
            });
            sbaseConfig.multiTenancy.onMongooseInstanceCreated(mi, tenancy);
            mongooseInstanceMap[tenancy] = mi;
        }
        const m = mi.model(model.name, model.$mongooseOptions(sbaseConfig, tenancy).mongooseSchema);
        m.sbaseConfig = sbaseConfig;
        tenantMap[tenancy] = m;
    }
    const proxy = new Proxy({}, {
        get: (_obj, prop) => {
            if (prop === '$tenantMap') {
                return tenantMap;
            }
            if (exports.lazyFns.indexOf(prop) >= 0) {
                const ret = function () {
                    const t = sbaseConfig.multiTenancy.tenancyFn(prop);
                    const m1 = tenantMap[t];
                    const actualFn = m1[prop];
                    return actualFn.apply(this, arguments);
                };
                return ret;
            }
            if (exports.shareFns.indexOf(prop) >= 0) {
                const ret = (...args) => {
                    return _.map(tenants, (t) => {
                        const m2 = tenantMap[t];
                        return m2[prop].apply(m2, args);
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
class DocumentModel extends Model {
    static cast() {
        return this._proxy || this;
    }
}
exports.DocumentModel = DocumentModel;
const SCHEMA_KEY = Symbol('sbase:schema');
const CONFIG_KEY = Symbol('sbase:config');
const PRE_KEY = Symbol('sbase:pre');
const POST_KEY = Symbol('sbase:post');
const VIRTUAL_KEY = Symbol('sbase:virtual');
const PLUGIN_KEY = Symbol('sbase:plugin');
const INDEX_KEY = Symbol('sbase:index');
const UPDATE_VALIDATOR_KEY = Symbol('sbase:updateValidator');
const MIXIN_KEY = Symbol('sbase:mixin');
const MONGOOSE_OPTIONS_KEY = Symbol('sbase:mongooseOptions');
function Enum(e, schema = {}) {
    return Field(_.extend({}, schema, {
        type: String,
        enum: Object.values(e).concat([null]),
    }));
}
exports.Enum = Enum;
function DBRef(ref, schema = {}) {
    return Field(_.extend({}, schema, {
        type: mongoose_1.SchemaTypes.ObjectId,
        ref,
    }));
}
exports.DBRef = DBRef;
function DBRefArray(ref, schema = {}) {
    return Field(_.extend({}, schema, {
        type: [
            {
                type: mongoose_1.SchemaTypes.ObjectId,
                ref,
            },
        ],
    }));
}
exports.DBRefArray = DBRefArray;
function ArrayField(type, schema = {}) {
    return Field(_.extend({}, schema, {
        type: [type],
        default: [],
    }));
}
exports.ArrayField = ArrayField;
function Required(opt = true, schema = {}) {
    return Field(_.extend({}, schema, {
        required: _.isFunction(opt) ? combineValidator(opt) : opt,
    }));
}
exports.Required = Required;
function IndexField(schema = {}) {
    return Field(_.extend({}, schema, {
        index: true,
    }));
}
exports.IndexField = IndexField;
function Unique(schema = {}) {
    return Field(_.extend({}, schema, {
        index: true,
        unique: true,
    }));
}
exports.Unique = Unique;
function Default(defaultValue, schema = {}) {
    return Field(_.extend({}, schema, {
        default: defaultValue,
    }));
}
exports.Default = Default;
function MapField(type, schema = {}) {
    return Field(_.extend({}, schema, {
        type: Map,
        of: type,
    }));
}
exports.MapField = MapField;
function Optional(schema = {}) {
    return Field(schema);
}
exports.Optional = Optional;
function Validate(validator, schema = {}) {
    return Field(_.extend({}, schema, {
        validate: {
            validator: combineValidator(validator.validator),
            message: validator.message,
        },
    }));
}
exports.Validate = Validate;
function Field(schema = {}) {
    function mapModelSchema(o) {
        if (_.isArray(o)) {
            return _.map(o, (x) => mapModelSchema(x));
        }
        else if (_.isFunction(o)) {
            if (o.prototype instanceof Model) {
                const func = Object.getOwnPropertyDescriptor(o.__proto__, '$mongooseOptions');
                return func.value.call(o).mongooseSchema;
            }
            else {
                return o;
            }
        }
        else if (_.isObject(o) && o.__proto__.constructor.name === 'Object') {
            return _.mapObject(o, (x) => mapModelSchema(x));
        }
        else {
            return o;
        }
    }
    return (target, propertyName) => {
        const schemas = Reflect.getOwnMetadata(SCHEMA_KEY, target) || {};
        const existing = schemas[propertyName];
        if (schema.type == null && existing == null) {
            const type = Reflect.getMetadata('design:type', target, propertyName);
            schema.type = type;
        }
        if (_.isUndefined(schema.default) &&
            schema.type &&
            schema.type.prototype instanceof Model) {
            schema.default = () => ({});
        }
        schemas[propertyName] = _.extend({}, existing, mapModelSchema(schema));
        Reflect.defineMetadata(SCHEMA_KEY, schemas, target);
    };
}
exports.Field = Field;
function Mixin(model) {
    return (constructor) => {
        const models = Reflect.getOwnMetadata(MIXIN_KEY, constructor.prototype) || [];
        models.push(model);
        Reflect.defineMetadata(MIXIN_KEY, models, constructor.prototype);
    };
}
exports.Mixin = Mixin;
function Config(config) {
    return (constructor) => {
        const configs = Reflect.getOwnMetadata(CONFIG_KEY, constructor.prototype) || {};
        _.extend(configs, config);
        Reflect.defineMetadata(CONFIG_KEY, configs, constructor.prototype);
    };
}
exports.Config = Config;
function Plugin(plugin) {
    return (constructor) => {
        const plugins = Reflect.getOwnMetadata(PLUGIN_KEY, constructor.prototype) || [];
        plugins.push(plugin);
        Reflect.defineMetadata(PLUGIN_KEY, plugins, constructor.prototype);
    };
}
exports.Plugin = Plugin;
function Pre(pre) {
    return (constructor) => {
        helpers_1.pushMetadata(PRE_KEY, constructor.prototype, pre);
    };
}
exports.Pre = Pre;
function Pres(names, pre) {
    return (constructor) => {
        const pres = _.map(names, (name) => _.extend({ name }, pre));
        helpers_1.pushMetadata(PRE_KEY, constructor.prototype, ...pres);
    };
}
exports.Pres = Pres;
function Virtual(options) {
    return (target, propertyName) => {
        const virtuals = Reflect.getOwnMetadata(VIRTUAL_KEY, target) || [];
        virtuals.push({
            name: propertyName,
            options,
        });
        Reflect.defineMetadata(VIRTUAL_KEY, virtuals, target);
    };
}
exports.Virtual = Virtual;
function Post(post) {
    return (constructor) => {
        const posts = Reflect.getOwnMetadata(POST_KEY, constructor.prototype) || [];
        posts.push(post);
        Reflect.defineMetadata(POST_KEY, posts, constructor.prototype);
    };
}
exports.Post = Post;
function Posts(names, post) {
    return (constructor) => {
        const posts = Reflect.getOwnMetadata(POST_KEY, constructor.prototype) || [];
        for (const name of names) {
            posts.push(_.extend({ name }, post));
        }
        Reflect.defineMetadata(POST_KEY, posts, constructor.prototype);
    };
}
exports.Posts = Posts;
function Index(index) {
    return (constructor) => {
        const indexes = Reflect.getOwnMetadata(INDEX_KEY, constructor.prototype) || [];
        indexes.push(index);
        Reflect.defineMetadata(INDEX_KEY, indexes, constructor.prototype);
    };
}
exports.Index = Index;
function UpdateValidator(validate) {
    return (constructor) => {
        const validates = Reflect.getOwnMetadata(UPDATE_VALIDATOR_KEY, constructor.prototype) || [];
        validates.push(validate);
        Reflect.defineMetadata(UPDATE_VALIDATOR_KEY, validates, constructor.prototype);
    };
}
exports.UpdateValidator = UpdateValidator;
class NativeError extends global.Error {
}
exports.NativeError = NativeError;
exports.preQueries = [
    'find',
    'findOne',
    'count',
    'findOneAndUpdate',
    'findOneAndRemove',
    'update',
];
const STATIC_FILTER_NAMES = ['name', 'length', 'prototype'];
function combineValidator(fn) {
    return function () {
        if (this instanceof mongoose_1.Query) {
            return fn.apply(this.getUpdate().$set, arguments);
        }
        else {
            return fn.apply(this, arguments);
        }
    };
}
exports.combineValidator = combineValidator;

//# sourceMappingURL=model.js.map
