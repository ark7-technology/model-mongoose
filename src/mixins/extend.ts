import _ from 'underscore';
import {
  Ark7ModelMetadata,
  CombinedModelField,
  Manager,
  ModelClass,
  manager as _manager,
  runtime,
} from '@ark7/model';

declare module '@ark7/model/core/configs' {
  export interface Ark7ModelMetadata {
    autogenFields(manager?: Manager): string[];
    readonlyFields(manager?: Manager): string[];
  }
}

declare module '@ark7/model/core/fields' {
  export interface CombinedModelField {
    isReadonly: boolean;
    isAutogen: boolean;
    autogenFields(manager?: Manager): string[];
    readonlyFields(manager?: Manager): string[];
  }
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

CombinedModelField.prototype.autogenFields = _.memoize(function (
  this: CombinedModelField,
  manager: Manager = _manager,
) {
  const names: string[] = [];
  if (this.isAutogen) {
    names.push(this.name);
  }

  const type = this.type;

  if (runtime.isReferenceType(type) && type.referenceName !== 'ID') {
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

  if (runtime.isReferenceType(type) && type.referenceName !== 'ID') {
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
