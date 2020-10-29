import * as mongoose from 'mongoose';
import _ from 'underscore';
import {
  Ark7ModelMetadata,
  CombinedModelField,
  Manager,
  Model,
  manager as _manager,
  runtime,
} from '@ark7/model';

declare module '@ark7/model/core/configs' {
  export interface Ark7ModelMetadata {
    autogenFields(manager?: Manager): string[];
    readonlyFields(manager?: Manager): string[];
    dataLevelPopulates(level: number, manager?: Manager): DataLevelPopulate;
  }
}

declare module '@ark7/model/core/fields' {
  export interface CombinedModelField {
    isReadonly: boolean;
    isAutogen: boolean;
    autogenFields(manager?: Manager): string[];
    readonlyFields(manager?: Manager): string[];
    dataLevelPopulates(level: number, manager?: Manager): DataLevelPopulate;
  }
}

export interface DataLevelPopulate {
  projections: string[];
  populates: mongoose.ModelPopulateOptions[];
}

let id: number = 0;
const objectMap: Map<any, string> = new Map();

function cashKey() {
  if (objectMap.has(this)) {
    return objectMap.get(this);
  }

  const idStr = (++id).toString();
  objectMap.set(this, idStr);
  return idStr;
}

function dataLevelCashKey(level: number) {
  return `${cashKey.call(this)}:${level}`;
}

Ark7ModelMetadata.prototype.dataLevelPopulates = _.memoize(function (
  this: Ark7ModelMetadata,
  level: number,
  manager: Manager = _manager,
) {
  if (this.isEnum || this.isCustomizedType) {
    return { projections: [''], populates: [] };
  }

  const x = _.chain(Array.from(this.combinedFields.values()))
    .filter((c) => !c.prop?.getter)
    .map((c) => c.dataLevelPopulates(level, manager))
    .foldl(
      (prev, curr) => ({
        projections: _.union(prev.projections, curr.projections),
        populates: _.union(prev.populates, curr.populates),
      }),
      { projections: [], populates: [] },
    )
    .value();

  if (this.modelClass.prototype instanceof Model) {
    x.projections = _.union(['_id'], x.projections);
  }

  return x;
},
dataLevelCashKey);

Ark7ModelMetadata.prototype.autogenFields = _.memoize(function (
  this: Ark7ModelMetadata,
  manager: Manager = _manager,
) {
  return _.chain(Array.from(this.combinedFields.values()))
    .map((c) => c.autogenFields(manager))
    .flatten()
    .value();
},
cashKey);

Ark7ModelMetadata.prototype.readonlyFields = _.memoize(function (
  this: Ark7ModelMetadata,
  manager: Manager = _manager,
) {
  return _.chain(Array.from(this.combinedFields.values()))
    .map((c) => c.readonlyFields(manager))
    .flatten()
    .value();
},
cashKey);

CombinedModelField.prototype.dataLevelPopulates = _.memoize(function (
  this: CombinedModelField,
  level: number,
  manager: Manager = _manager,
) {
  const res: DataLevelPopulate = {
    populates: [],
    projections: [],
  };
  if (
    (this.field?.level != null && this.field.level > level) ||
    this.isMethod
  ) {
    return res;
  }

  const type = this.type;

  if (runtime.isReferenceType(type) && type.referenceName !== 'ID') {
    const l = this.field?.passLevelMap
      ? this.field.passLevelMap[level] || level
      : level;

    const next = manager
      .getMetadata(type.referenceName)
      .dataLevelPopulates(l, manager);

    if (this.isReference || this.isVirtualReference) {
      res.populates.push({
        path: this.name,
        select: _.chain(next.projections)
          .union(['_id'])
          .map((p) => [p, 1])
          .object()
          .value(),
        populate: next.populates,
      });

      if (!this.isVirtualReference) {
        res.projections.push(this.name);
      }
    } else {
      _.each(next.projections, (p) =>
        res.projections.push(`${this.name}${p === '' ? '' : '.' + p}`),
      );
    }
  } else if (this.isVirtualReference) {
    res.populates.push({
      path: this.name,
      populate: [],
    });
  } else {
    res.projections.push(this.name);
  }

  return res;
},
dataLevelCashKey);

CombinedModelField.prototype.autogenFields = _.memoize(function (
  this: CombinedModelField,
  manager: Manager = _manager,
) {
  const names: string[] = [];
  if (this.isAutogen) {
    names.push(this.name);
  }

  const type = this.type;

  if (
    runtime.isReferenceType(type) &&
    !this.isReference &&
    type.referenceName !== 'ID'
  ) {
    const metadata = manager.getMetadata(type.referenceName);
    const nested = _.map(
      metadata.autogenFields(manager),
      (f) => `${this.name}.${f}`,
    );

    names.push(...nested);
  }
  return names;
},
cashKey);

CombinedModelField.prototype.readonlyFields = _.memoize(function (
  this: CombinedModelField,
  manager: Manager = _manager,
) {
  const names: string[] = [];
  if (this.isReadonly) {
    names.push(this.name);
  }

  const type = this.type;

  if (
    runtime.isReferenceType(type) &&
    !this.isReference &&
    type.referenceName !== 'ID'
  ) {
    const metadata = manager.getMetadata(type.referenceName);
    const nested = _.map(
      metadata.readonlyFields(manager),
      (f) => `${this.name}.${f}`,
    );

    names.push(...nested);
  }
  return names;
},
cashKey);

Object.defineProperty(CombinedModelField.prototype, 'isReadonly', {
  get: function (this: CombinedModelField) {
    return this.field?.readonly || this.prop?.readonly || false;
  },
});

Object.defineProperty(CombinedModelField.prototype, 'isAutogen', {
  get: function (this: CombinedModelField) {
    return this.field?.autogen || false;
  },
});
