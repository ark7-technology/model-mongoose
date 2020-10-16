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

    const mongooseOptions: MongooseOptions = this.createMongooseOptionsFrom(
      A7Model.getMetadata(model),
    );

    this.mongooseOptionsMap.set(name, mongooseOptions);

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

      // console.log('reference', referenceMongooseOptions);

      return referenceMongooseOptions.mongooseSchema;
    }
  }

  private createMongooseOptionsFrom(
    metadata: Ark7ModelMetadata,
  ): MongooseOptions {
    // console.log(metadata);

    const result: MongooseOptions = {
      name: metadata.name,
      schema: {},
      virtuals: [],
      methods: [],
      statics: [],
    };

    _.each(
      Object.getOwnPropertyDescriptors(metadata.modelClass),
      (desc, key) => {
        if (['name', 'prototype', 'length'].indexOf(key) >= 0) {
          return;
        }

        result.statics.push({
          name: key,
          fn: desc.value,
        });
        // console.log(key, prop);
      },
    );

    _.each(metadata.configs.schema.props, (prop) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        metadata.modelClass.prototype,
        prop.name,
      );

      if (descriptor == null) {
        if (prop.modifier === runtime.Modifier.PUBLIC && !prop.readonly) {
          result.schema[prop.name] = {
            type: this.mapPropertyType(prop.type),
            required: !prop.optional,
          };
        }
      } else {
        if (descriptor.value && _.isFunction(descriptor.value)) {
          result.methods.push({ name: prop.name, fn: descriptor.value });
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
          result.virtuals.push(virtual);
        }
      }
    });

    // console.log(metadata.configs.schema.props);
    // console.log(schema);

    result.mongooseSchema = new mongoose.Schema(result.schema);

    for (const method of result.methods) {
      d(
        'create method for %O with name %O and function %O',
        metadata.name,
        method.name,
        method.fn,
      );
      result.mongooseSchema.methods[method.name] = method.fn;
    }

    for (const method of result.statics) {
      d(
        'create static function for %O with name %O and function %O',
        metadata.name,
        method.name,
        method.fn,
      );
      result.mongooseSchema.statics[method.name] = method.fn;
    }

    return result;
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
