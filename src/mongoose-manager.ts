import * as mongoose from 'mongoose';
import _ from 'underscore';
import debug from 'debug';
import { A7Model, Ark7ModelMetadata, ModelClass, runtime } from '@ark7/model';
import { MongoError } from 'mongodb';

const d = debug('ark7:model-mongoose:mongoose-manager');

export class MongooseManager {
  private mongooseOptionsMap: Map<string, MongooseOptions> = new Map();

  constructor(private mongoose?: mongoose.Mongoose) {
    this.mongoose = this.mongoose ?? mongoose;
  }

  register<T>(cls: string | ModelClass<T>): T {
    const mongooseOptions = this.getMongooseOptions(cls);

    return mongoose.model(
      mongooseOptions.name,
      mongooseOptions.mongooseSchema,
    ) as any;
  }

  getMongooseOptions(model: string | ModelClass<any>): MongooseOptions {
    const name = _.isString(model) ? model : model.name;

    if (this.mongooseOptionsMap.has(name)) {
      return this.mongooseOptionsMap.get(name);
    }

    const metadata = A7Model.getMetadata(model);

    const mongooseOptions: MongooseOptions = {
      name: metadata.name,
      mongooseSchema: new mongoose.Schema(),
      schema: {},
      virtuals: [],
      methods: [],
      statics: [],
    };

    this.mongooseOptionsMap.set(name, mongooseOptions);

    this.createMongooseOptionsFrom(mongooseOptions, metadata);
    return mongooseOptions;
  }

  private mapPropertyType(type: runtime.Type): any {
    switch (type) {
      case 'string':
        return String;
    }

    if (runtime.isReferenceType(type)) {
      const referenceMongooseOptions = this.getMongooseOptions(
        type.referenceName,
      );

      return referenceMongooseOptions.mongooseSchema;
    }

    if (runtime.isArrayType(type)) {
      const mType = this.mapPropertyType(type.arrayElementType);

      return [
        {
          type: mType,
          default: [],
        },
      ];
    }
  }

  private createMongooseOptionsFrom(
    options: MongooseOptions,
    metadata: Ark7ModelMetadata,
  ): MongooseOptions {
    _.each(
      Object.getOwnPropertyDescriptors(metadata.modelClass),
      (desc, key) => {
        if (['name', 'prototype', 'length'].indexOf(key) >= 0) {
          return;
        }

        options.statics.push({
          name: key,
          fn: desc.value,
        });
      },
    );

    _.each(metadata.configs.schema.props, (prop) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        metadata.modelClass.prototype,
        prop.name,
      );

      if (descriptor == null) {
        if (prop.modifier === runtime.Modifier.PUBLIC && !prop.readonly) {
          options.schema[prop.name] = {
            type: this.mapPropertyType(prop.type),
            required: !prop.optional,
          };
        }
      } else {
        if (descriptor.value && _.isFunction(descriptor.value)) {
          options.methods.push({ name: prop.name, fn: descriptor.value });
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
        }
      }
    });

    options.mongooseSchema.add(options.schema);

    for (const virtual of options.virtuals) {
      d(
        'create virtual for %O with name %O and options %O',
        metadata.name,
        virtual.name,
        virtual.options,
      );
      let v = options.mongooseSchema.virtual(virtual.name, virtual.options);
      if (virtual.get) {
        v = v.get(virtual.get);
      }
      if (virtual.set) {
        v = v.set(virtual.set);
      }
    }

    for (const method of options.methods) {
      d(
        'create method for %O with name %O and function %O',
        metadata.name,
        method.name,
        method.fn,
      );
      options.mongooseSchema.methods[method.name] = method.fn;
    }

    for (const method of options.statics) {
      d(
        'create static function for %O with name %O and function %O',
        metadata.name,
        method.name,
        method.fn,
      );
      options.mongooseSchema.statics[method.name] = method.fn;
    }

    return options;
  }
}

export const mongooseManager = new MongooseManager();

/**
 * Mongoose options for current model.
 */
export interface MongooseOptions {
  name?: string;
  config?: mongoose.SchemaOptions;
  schema?: {
    [key: string]: any;
  };
  mongooseSchema?: mongoose.Schema;
  pres?: Pre[];
  posts?: Post[];
  virtuals?: Virtual[];
  methods?: Method[];
  statics?: Method[];
  plugins?: Plugin[];
  indexes?: MongooseIndex[];
  updateValidators?: UpdateValidator[];
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
