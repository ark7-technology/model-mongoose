import _ from 'underscore';
import debug from 'debug';
import {
  A7Model,
  Ark7ModelMetadata,
  CombinedModelField,
  Manager,
  Model,
  manager as _manager,
  runtime,
} from '@ark7/model';
import { PopulateOptions } from 'mongoose';

import { CircleDependencyError } from '../errors';

const d = debug('ark7:model-mongoose:mixins:extend');

declare module '@ark7/model/core/configs' {
  export interface Ark7ModelMetadata {
    autogenFields(manager?: Manager): string[];
    readonlyFields(manager?: Manager): string[];

    /**
     * Returns the data level populations.
     */
    dataLevelPopulates(
      level: number,
      manager?: Manager,
      path?: string,
    ): DataLevelPopulate;
  }
}

declare module '@ark7/model/core/fields' {
  export interface CombinedModelField {
    isReadonly: boolean;
    isAutogen: boolean;
    autogenFields(manager?: Manager): string[];
    readonlyFields(manager?: Manager): string[];
    isMongooseField: boolean;

    /**
     * Returns the data level populations for the current field.
     */
    dataLevelPopulates(
      level: number,
      manager?: Manager,
      path?: string,
    ): DataLevelPopulate;
  }
}

declare module 'mongoose' {
  export interface PopulateOptions {
    strictPopulate: boolean;
  }
}

export interface DataLevelPopulate {
  projections: string[];
  populates: PopulateOptions[];
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

export function mergePopulates(
  p1: DataLevelPopulate,
  p2: DataLevelPopulate,
): DataLevelPopulate {
  return {
    projections: _.union(p1.projections, p2.projections),
    populates: _.uniq(_.union(p1.populates, p2.populates), (p) => p.path),
  };
}

Ark7ModelMetadata.prototype.dataLevelPopulates = _.memoize(function (
  this: Ark7ModelMetadata,
  level: number,
  manager: Manager = _manager,
  path?: string,
) {
  d('Get Ark7ModelMetadata(%O).dataLevelPopulates, path: %O', this.name, path);

  if (this.isEnum || this.isCustomizedType) {
    return { projections: [''], populates: [] };
  }

  if (path?.split('.').length > 10) {
    throw new CircleDependencyError(path);
  }

  try {
    let x = _.chain(Array.from(this.combinedFields.values()))
      .filter((c) => !c.prop?.getter)
      .map((c) =>
        c.dataLevelPopulates(
          level,
          manager,
          path == null ? this.name : `${path}(${this.name})`,
        ),
      )
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

    _.each(this.discriminations, (discrimination) => {
      const metadata = A7Model.getMetadata(discrimination.$modelClassName);
      const populates = metadata.dataLevelPopulates(level, manager, path);
      x = mergePopulates(x, populates);
    });
    return x;
  } catch (error) {
    if (error instanceof RangeError) {
      throw new CircleDependencyError(path);
    } else {
      throw error;
    }
  }
},
dataLevelCashKey);

Ark7ModelMetadata.prototype.autogenFields = _.memoize(function (
  this: Ark7ModelMetadata,
  manager: Manager = _manager,
) {
  d('Get Ark7ModelMetadata(%O).autogenFields', this.name);
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
  d('Get Ark7ModelMetadata(%O).readonlyFields', this.name);
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
  path?: string,
) {
  d(
    'Get CombinedModelField(%O).dataLevelPopulates, path: %O, level: %O, populateLevel: %O',
    this.name,
    path,
    level,
    this.field?.populateLevel,
  );

  const res: DataLevelPopulate = {
    populates: [],
    projections: [],
  };

  if (
    (this.field?.level != null && this.field.level > level) ||
    this.isMethod ||
    this.prop?.modifier === runtime.Modifier.PRIVATE ||
    this.prop?.modifier === runtime.Modifier.PROTECTED ||
    this.field?.noPersist
  ) {
    return res;
  }

  const populateLevel = this.field?.populateLevel ?? this.field?.level;
  const isPopulate = populateLevel != null && populateLevel <= level;

  const type = this.type;

  let isNestedProjected = false;
  let isNestedPopulated = false;
  const isForeignField = this.isReference || this.isVirtualReference;

  if (
    runtime.isReferenceType(type) &&
    type.referenceName !== 'ID' &&
    (isPopulate || !isForeignField)
  ) {
    const l = this.field?.passLevelMap
      ? this.field.passLevelMap[level] || level
      : level;

    const next = manager
      .getMetadata(type.referenceName)
      .dataLevelPopulates(
        l,
        manager,
        path == null ? this.name : path + '.' + this.name,
      );

    if (isForeignField && isPopulate) {
      isNestedPopulated = true;
      res.populates.push({
        path: this.name,
        select: _.chain(next.projections)
          .union(['_id'])
          .map((p) => [p, 1])
          .object()
          .value(),
        populate: isPopulate ? next.populates : [],
        strictPopulate: false,
      });
    }

    if (!isForeignField) {
      isNestedProjected = true;
      isNestedPopulated = true;

      // Map can't do projection so far. TODO: figure out better solution.
      if (!this.isMap) {
        _.each(next.projections, (p) =>
          res.projections.push(`${this.name}${p === '' ? '' : '.' + p}`),
        );
      }

      _.each(next.populates, (p) =>
        res.populates.push(
          _.defaults(
            {
              path: `${this.name}.${this.isMap ? '$*.' : ''}${p.path}`,
              strictPopulate: false,
            },
            p,
          ),
        ),
      );
    }
  }

  if ((!this.isVirtualReference && !isNestedProjected) || this.isMap) {
    res.projections.push(this.name);
  }

  if (this.isVirtualReference && !isNestedPopulated && isPopulate) {
    res.populates.push({
      path: this.name,
      populate: [],
      strictPopulate: false,
    });
  }

  return res;
},
dataLevelCashKey);

CombinedModelField.prototype.autogenFields = _.memoize(function (
  this: CombinedModelField,
  manager: Manager = _manager,
) {
  d('Get CombinedModelField(%O).autogenFields', this.name);
  const names: string[] = [];
  if (this.isAutogen) {
    names.push(this.name);
  }

  const type = this.type;

  if (
    this.isMongooseField &&
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
  d('Get CombinedModelField(%O).readonlyFields', this.name);
  const names: string[] = [];
  if (this.isReadonly) {
    names.push(this.name);
  }

  const type = this.type;

  if (
    this.isMongooseField &&
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

Object.defineProperty(CombinedModelField.prototype, 'isMongooseField', {
  get: function (this: CombinedModelField) {
    return (
      !this.field?.noPersist &&
      !this.field?.isVirtualReference &&
      !(
        this.prop?.modifier != null &&
        this.prop.modifier !== runtime.Modifier.PUBLIC
      ) &&
      !(this.descriptor?.get || this.descriptor?.set)
    );
  },
});
