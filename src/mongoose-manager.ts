import * as mongoose from 'mongoose';
import _ from 'underscore';
import debug from 'debug';
import {
  A7Model,
  Ark7ModelMetadata,
  Model,
  ModelClass,
  runtime,
} from '@ark7/model';
import { MongoError } from 'mongodb';

import { MongooseKoa } from './mixins/koa';
import {
  MongooseOptionsPlugin,
  MongooseOptionsPluginOptions,
  MongoosePluginPeriod,
  TRUE_SUITABLE,
} from './plugin';

declare module '@ark7/model/core/model' {
  interface ID extends mongoose.Types.ObjectId {}
}

const d = debug('ark7:model-mongoose:mongoose-manager');

export type ModifiedDocument<T> = Omit<T, '_id'> & {
  _id: mongoose.Types.ObjectId;
};

export class MongooseManager {
  private mongoose: mongoose.Mongoose;
  private mongooseOptionsMap: Map<string, MongooseOptions> = new Map();

  plugins: Map<
    MongoosePluginPeriod,
    MongooseOptionsPluginOptions[]
  > = new Map();

  constructor(_mongoose: mongoose.Mongoose = mongoose) {
    this.mongoose = _mongoose;
  }

  plugin(
    period: MongoosePluginPeriod,
    plugin: MongooseOptionsPluginOptions | MongooseOptionsPlugin,
  ) {
    if (!this.plugins.has(period)) {
      this.plugins.set(period, []);
    }

    this.plugins
      .get(period)
      .push(
        _.isFunction(plugin) ? { suitable: TRUE_SUITABLE, fn: plugin } : plugin,
      );
  }

  protected runPlugin(period: MongoosePluginPeriod, options: MongooseOptions) {
    const plugins: MongooseOptionsPluginOptions[] =
      this.plugins.get(period) || [];

    for (const plugin of plugins) {
      if (!plugin.suitable(options)) {
        continue;
      }

      d(
        'run suitable plugin for period %O with function %O',
        period,
        plugin.fn,
      );

      plugin.fn(options);
    }
  }

  register<T, P extends ModelClass<T>>(
    cls: P,
    options?: mongoose.SchemaOptions,
  ): mongoose.Model<mongoose.Document & ModifiedDocument<InstanceType<P>>> &
    P &
    typeof MongooseKoa {
    const mongooseOptions = this.getMongooseOptions(cls as any);

    mongooseOptions.updateMetadata(A7Model.getMetadata(MongooseKoa), this);

    this.runPlugin(MongoosePluginPeriod.BEFORE_REGISTER, mongooseOptions);

    _.each(
      _.extend(
        {
          toObject: {
            versionKey: false,
            flattenMaps: true,
          },
        },
        options,
      ),
      (value, key: keyof mongoose.SchemaOptions) => {
        (mongooseOptions.mongooseSchema as mongoose.Schema).set(key, value);
      },
    );

    const model = this.mongoose.model(
      mongooseOptions.name,
      mongooseOptions.mongooseSchema as mongoose.Schema,
    ) as any;

    model.on('index', (err: any) => {
      if (err) {
        throw new Error(`${mongooseOptions.name} index error: ${err}`);
      }
    });

    return model;
  }

  getMongooseOptions(model: string | ModelClass<any>): MongooseOptions {
    const name = _.isString(model) ? model : model.name;
    const key = name.toLowerCase();

    if (this.mongooseOptionsMap.has(key)) {
      return this.mongooseOptionsMap.get(key);
    }

    const metadata = A7Model.getMetadata(model);

    const mongooseOptions = new MongooseOptions(
      name,
      metadata,
    ).createMongooseSchema();

    this.mongooseOptionsMap.set(key, mongooseOptions);

    return mongooseOptions.updateMetadata(metadata, this);
  }

  mapPropertyType(type: runtime.Type): any {
    switch (type) {
      case 'string':
        return { type: String };

      case 'number':
        return { type: Number };

      case 'any':
        return { type: mongoose.SchemaTypes.Mixed };

      case 'ID':
        return { type: mongoose.SchemaTypes.ObjectId };
    }

    if (runtime.isReferenceType(type)) {
      switch (type.referenceName) {
        case 'Date':
          return { type: Date };
        default:
          const referenceMongooseOptions = this.getMongooseOptions(
            type.referenceName,
          );

          return referenceMongooseOptions.mongooseSchema instanceof
            mongoose.Schema
            ? { type: referenceMongooseOptions.mongooseSchema }
            : _.clone(referenceMongooseOptions.mongooseSchema);
      }
    }

    if (runtime.isArrayType(type)) {
      const mType = this.mapPropertyType(type.arrayElementType);

      return {
        type: [mType],
        default: [],
      };
    }

    if (runtime.isParameterizedType(type)) {
      const mType = this.mapPropertyType(type.typeArgumentType);

      switch (type.selfType) {
        case 'Ref':
          if (runtime.isReferenceType(type.typeArgumentType)) {
            return {
              type: 'ObjectId',
              ref: type.typeArgumentType.referenceName,
            };
          }

        case 'MMap':
          const subType = this.mapPropertyType(type.typeArgumentType);
          if (subType == null) {
            throw new Error(`Unable to locate type ${type}`);
          }
          return {
            type: Map,
            of: subType.type,
          };
      }

      return mType;
    }
  }
}

export const mongooseManager = new MongooseManager();

/**
 * Mongoose options for current model.
 */
export class MongooseOptions {
  config: mongoose.SchemaOptions = {};
  schema: {
    [key: string]: any;
  } = {};
  mongooseSchema?: mongoose.Schema | object;
  pres: Pre[] = [];
  posts: Post[] = [];
  virtuals: Virtual[] = [];
  methods: Method[] = [];
  statics: Method[] = [];
  plugins: Plugin[] = [];
  indexes: MongooseIndex[] = [];
  updateValidators: UpdateValidator[] = [];

  constructor(public name: string, public metadata: Ark7ModelMetadata) {}

  methodNames(): string[] {
    return _.map(this.methods, (m) => m.name);
  }

  fieldNames(): string[] {
    return _.keys(this.schema);
  }

  clone(): MongooseOptions {
    const ret = new MongooseOptions(this.name, this.metadata);
    ret.config = this.config;
    ret.schema = this.schema;
    ret.mongooseSchema = this.mongooseSchema;
    ret.pres = this.pres;
    ret.posts = this.posts;
    ret.virtuals = this.virtuals;
    ret.methods = this.methods;
    ret.statics = this.statics;
    ret.plugins = this.plugins;
    ret.indexes = this.indexes;
    ret.updateValidators = this.updateValidators;

    return ret;
  }

  createMongooseSchema(mongooseSchema?: mongoose.Schema): this {
    this.mongooseSchema =
      this.mongooseSchema ??
      mongooseSchema ??
      (this.metadata.isEnum
        ? {
            type: this.metadata.enumType === 'string' ? String : Number,
            enum: this.metadata.enumValues,
          }
        : new mongoose.Schema());

    return this;
  }

  updateMetadata(metadata: Ark7ModelMetadata, manager: MongooseManager): this {
    const currentOptions = MongooseOptions.createFromCurrentMetadata(
      metadata,
      manager,
    );

    this.updateMongooseOptions(currentOptions);

    return this.updateMongooseSchema(metadata);
  }

  protected updateMongooseOptions(options: MongooseOptions): this {
    _.defaults(this.config, options.config);
    _.defaults(this.schema, options.schema);
    this.pres = _.union([...this.pres, ...options.pres]);
    this.posts = _.union([...this.posts, ...options.posts]);
    this.virtuals = _.union([...this.virtuals, ...options.virtuals]);
    this.methods = _.union([...this.methods, ...options.methods]);
    this.statics = _.union([...this.statics, ...options.statics]);
    this.plugins = _.union([...this.plugins, ...options.plugins]);
    this.indexes = _.union([...this.indexes, ...options.indexes]);
    this.updateValidators = _.union([
      ...this.updateValidators,
      ...options.updateValidators,
    ]);

    return this;
  }

  protected updateMongooseSchema(metadata: Ark7ModelMetadata): this {
    if (!(this.mongooseSchema instanceof mongoose.Schema)) {
      return this;
    }

    if (!(metadata.modelClass.prototype instanceof Model)) {
      this.mongooseSchema.set('_id', false);
      this.mongooseSchema.set('id', false);
    }

    try {
      this.mongooseSchema.add(this.schema);
    } catch (error) {
      console.error('Invalid schema to add', this.schema);
      throw error;
    }

    for (const virtual of this.virtuals) {
      d(
        'create virtual for %O with name %O and options %O',
        this.name,
        virtual.name,
        virtual.options,
      );
      let v = this.mongooseSchema.virtual(virtual.name, virtual.options);
      if (virtual.get) {
        v = v.get(virtual.get);
      }
      if (virtual.set) {
        v = v.set(virtual.set);
      }
    }

    for (const method of this.methods) {
      d(
        'create method for %O with name %O and function %O',
        this.name,
        method.name,
        method.fn,
      );
      this.mongooseSchema.methods[method.name] = method.fn;
    }

    for (const method of this.statics) {
      d(
        'create static function for %O with name %O and function %O',
        this.name,
        method.name,
        method.fn,
      );
      this.mongooseSchema.statics[method.name] = method.fn;
    }

    for (const index of this.indexes) {
      d(
        'create index for %O with fields %O and options %O',
        this.name,
        index.fields,
        index.options,
      );
      this.mongooseSchema.index(index.fields, index.options);
    }

    return this;
  }

  protected static createFromCurrentMetadata(
    metadata: Ark7ModelMetadata,
    manager: MongooseManager,
  ): MongooseOptions {
    const options = new MongooseOptions(metadata.name, metadata);

    metadata.combinedFields.forEach((field) => {
      if (['_id', 'toObject', '$attach'].indexOf(field.name) >= 0) {
        return;
      }

      if (field.field == null && field.prop?.abstract) {
        return;
      }

      const target: any = _.defaults({}, field.field);
      const prop = field.prop;
      const descriptor = field.descriptor;

      if (field.descriptor == null) {
        if (
          field.prop.modifier === runtime.Modifier.PUBLIC &&
          !field.prop.readonly
        ) {
          const type = manager.mapPropertyType(field.prop.type);

          _.defaults(
            target,
            options.schema[prop.name],
            _.isObject(type) && !_.isFunction(type) && type.type != null
              ? _.extend(type, {
                  required: !prop.optional,
                })
              : {
                  type,
                  required: !prop.optional,
                },
          );
        }
      } else {
        if (descriptor.value && _.isFunction(descriptor.value)) {
          options.methods.push({ name: prop.name, fn: descriptor.value });
          return;
        }

        if (descriptor.get || descriptor.set) {
          const virtual: Virtual = {
            name: prop.name,
          };
          if (descriptor.get) {
            virtual.get = descriptor.get;
          }
          if (descriptor.set) {
            virtual.set = descriptor.set;
          }
          options.virtuals.push(virtual);
          return;
        }
      }

      options.schema[field.name] = target;
    });

    for (const cls of metadata.classes.reverse()) {
      _.each(Object.getOwnPropertyDescriptors(cls), (desc, key) => {
        if (['name', 'prototype', 'length', 'modelize'].indexOf(key) >= 0) {
          return;
        }

        if (_.find(options.statics, (s) => s.name === key) == null) {
          options.statics.push({
            name: key,
            fn: desc.value,
          });
        }
      });
    }

    options.indexes = metadata.configs.indexes || [];

    d('create schema for %O with %O', metadata.name, options.schema);

    return options;
  }
}

export interface Pre {
  name: string;
  fn: (next: (err?: NativeError) => void) => void;
  parallel?: boolean;
  errorCb?: (err: Error) => void;
}

export interface PPre {
  fn: (next: (err?: NativeError) => void) => void;
  parallel?: boolean;
  errorCb?: (err: Error) => void;
}

export interface Post {
  name: string;
  fn: PostFn1 | PostFn2;
}

export interface PPost {
  fn: PostFn1 | PostFn2;
}

export type PostFn1 = (doc: object, next: (err?: NativeError) => void) => void;
export type PostFn2 = (
  error: MongoError,
  doc: object,
  next: (err?: NativeError) => void,
) => void;

export interface Virtual {
  name: string;
  get?: () => any;
  set?: (val?: any) => void;
  options?: VirtualOptions;
}

export interface Method {
  name: string;
  fn: () => void;
}

export interface Plugin {
  fn: (schema: mongoose.Schema, options?: object) => void;
  options?: object;
  priority?: number;
}

export interface MongooseIndex {
  fields: object;
  options?: {
    expires?: string;
    [other: string]: any;
  };
}

export interface Validator {
  validator: (v: any) => any;
  message: string | ((props: { value: any }) => string);
}

export interface UpdateValidator {
  path: string;
  fn: (val?: any) => boolean;
  errorMsg?: string;
  type?: string;
}

export interface VirtualOptions {
  ref: string;
  localField: string;
  foreignField: string;
  justOne?: boolean;
  options?: any;
  count?: boolean;
  match?: object;
}

export class NativeError extends global.Error {}
