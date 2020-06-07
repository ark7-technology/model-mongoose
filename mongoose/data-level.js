"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Level = exports.DataLevelModel = void 0;
const _ = require("underscore");
const model = require("./model");
const _1 = require("./");
let DataLevelModel = class DataLevelModel extends model.DocumentModel {
    toJSON(options) {
        let obj = this.toObject(options);
        if (options && options.level) {
            const fields = _.keys(fetchModelFields(this.schema.options.dataLevel, options.level, this.schema.dataLevel.levelMap));
            obj = deepOmit(obj, fields);
        }
        return obj;
    }
};
DataLevelModel = __decorate([
    model.Plugin({
        fn: dataLevelPlugin,
        priority: 100,
    })
], DataLevelModel);
exports.DataLevelModel = DataLevelModel;
function deepOmit(obj, fields) {
    if (_.isArray(obj)) {
        return _.map(obj, (o) => deepOmit(o, fields));
    }
    const grouped = _.groupBy(fields, (f) => (f.indexOf('.') === -1 ? 1 : 0));
    if (grouped[1]) {
        obj = _.omit(obj, ...grouped[1]);
    }
    if (grouped[0]) {
        const goal = _.chain(grouped[0])
            .map((v) => {
            const idx = v.indexOf('.');
            return [v.substr(0, idx), v.substring(idx + 1)];
        })
            .groupBy((pair) => pair[0])
            .mapObject((pairs) => _.map(pairs, (p) => p[1]))
            .value();
        _.each(goal, (fs, name) => {
            if (obj && obj[name]) {
                obj[name] = deepOmit(obj[name], fs);
            }
        });
    }
    return obj;
}
function dataLevelPlugin(schema, options) {
    if (schema.dataLevel != null) {
        return;
    }
    if (options == null) {
        options = schema.options;
    }
    const dataLevelOptionsLevels = _.values((options.dataLevel && options.dataLevel.levels) || []);
    schema.dataLevel = {
        levelMap: {},
    };
    _.each(schema.paths, (st, path) => {
        if (st && st.schema) {
            dataLevelPlugin(st.schema, options);
        }
    });
    addToLevelMap(schema, levelPaths(schema));
    for (const name of model.preQueries) {
        schema.pre(name, modifyProjection);
    }
}
function modifyProjection(next) {
    const schema = this.schema;
    if (!schema.options || !schema.options.dataLevel) {
        next();
        return;
    }
    const levels = _.values(schema.options.dataLevel.levels);
    const level = this.options.level ||
        (schema.options.dataLevel && schema.options.dataLevel.default);
    if (level) {
        if (this._fields == null) {
            this._fields = {};
        }
        if (_.findIndex(_.values(this._fields), (x) => x === true || x === 1) ===
            -1) {
            const projectedFields = fetchModelFields(schema.options.dataLevel, level, schema.dataLevel.levelMap);
            _.extend(this._fields, projectedFields);
        }
    }
    next();
}
function fetchModelFields(config, level, levelMap) {
    if (config._levelsMap == null) {
        config._levelsMap = {};
    }
    if (config._levelsMap[level]) {
        return config._levelsMap[level];
    }
    const fields = [];
    let valid = false;
    _.each(_.values(config.levels), (l) => {
        if (valid) {
            _.each(levelMap[l], (p) => {
                fields.push(p);
            });
        }
        if (l === level) {
            valid = true;
        }
    });
    const filtered = _.filter(fields, (target) => {
        return _.all(fields, (r) => {
            return target.indexOf(r + '.') !== 0;
        });
    });
    const result = {};
    _.each(filtered, (f) => {
        result[f] = 0;
    });
    config._levelsMap[level] = result;
    return result;
}
function addToLevelMap(schema, lps) {
    const dataLevelOptionsLevels = _.values((schema.options.dataLevel && schema.options.dataLevel.levels) || []);
    const levelMap = schema.dataLevel.levelMap;
    for (const { path, level } of lps) {
        levelMap[level] = _.union(levelMap[level], [path]);
    }
    _.each(schema.paths, (st, path) => {
        if (st && st.schema) {
            const s = st.schema;
            _.each(s.dataLevel.levelMap, (ps, l) => {
                levelMap[l] = _.union(levelMap[l], _.map(ps, (p) => `${path}.${p}`));
            });
        }
    });
}
function levelPaths(schema) {
    const res = [];
    schema.eachPath((pathname, schemaType) => {
        if (pathname.indexOf('$*') >= 0) {
            return;
        }
        const level = schemaType.options.level;
        if (level != null) {
            res.push({ path: pathname, level });
        }
    });
    return res;
}
function Level(level, schema = {}) {
    return _1.Field(_.extend({}, schema, {
        level,
    }));
}
exports.Level = Level;

//# sourceMappingURL=data-level.js.map
