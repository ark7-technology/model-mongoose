import * as mongoose from 'mongoose';
import _ from 'underscore';
import {
  A7Model,
  Ark7ModelMetadata,
  AsObject,
  DocumentToObjectOptions,
  LevelOptions,
  Manager,
  Model,
  ModelClass,
  StrictModel,
  manager as _manager,
} from '@ark7/model';

import { ModifiedDocument, MongooseManager } from './mongoose-manager';
import { MongooseKoa } from './mixins/koa';

declare module 'mongoose' {
  interface DocumentToObjectOptions {
    level?: number;
  }

  interface QueryFindBaseOptions {
    level?: number;
  }

  interface QueryPopulateOptions {
    level?: number;
  }
}

StrictModel.prototype.toJSON = function toJSON<T>(
  this: T,
  options: DocumentToObjectOptions = {},
  manager?: Manager,
): AsObject<T> {
  manager = manager ?? _manager;

  const ret: any = {};
  const modelName = (this as any).__proto__.constructor.modelName;
  const metadata = A7Model.getMetadata(modelName);

  const orig = (this as any).toObject();

  for (const name of metadata.combinedFields.keys()) {
    const field = metadata.combinedFields.get(name);
    if (field.isMethod) {
      continue;
    }

    if (
      options.level != null &&
      (field.field as LevelOptions)?.level > options.level
    ) {
      continue;
    }

    const target = orig[name];

    if (!_.isUndefined(target)) {
      ret[name] = field.toObject(target, _manager, options);
    }
  }
  return ret;
};

@A7Model({})
export class MongooseModel extends Model {
  static mongooseManager: MongooseManager;

  public static cast<D extends mongoose.Document>(): mongoose.Model<D> {
    return (this as any)._proxy || this;
  }

  public static getMetadata(manager: Manager = _manager): Ark7ModelMetadata {
    return manager.getMetadata(
      this.prototype instanceof mongoose.Model ? (this as any).modelName : this,
    );
  }
}

export interface MongooseModel
  extends Omit<mongoose.Document, 'toJSON' | 'toObject' | '_id'> {}

@A7Model({})
export class DiscriminateMongooseModel extends MongooseModel {
  static $discriminator<
    T,
    P extends ModelClass<T>,
    T1,
    P1 extends ModelClass<T1>,
    T2,
    P2 extends ModelClass<T2>,
    T3,
    P3 extends ModelClass<T3>,
    T4,
    P4 extends ModelClass<T4>,
    T5,
    P5 extends ModelClass<T5>,
    T6,
    P6 extends ModelClass<T6>,
    T7,
    P7 extends ModelClass<T7>,
    T8,
    P8 extends ModelClass<T8>,
    T9,
    P9 extends ModelClass<T9>
  >(
    cls: P,
    options?: mongoose.SchemaOptions,
    _m1?: P1,
    _m2?: P2,
    _m3?: P3,
    _m4?: P4,
    _m5?: P5,
    _m6?: P6,
    _m7?: P7,
    _m8?: P8,
    _m9?: P9,
  ): mongoose.Model<
    mongoose.Document &
      ModifiedDocument<
        InstanceType<P> &
          InstanceType<P1> &
          InstanceType<P2> &
          InstanceType<P3> &
          InstanceType<P4> &
          InstanceType<P5> &
          InstanceType<P6> &
          InstanceType<P7> &
          InstanceType<P8> &
          InstanceType<P9>
      >
  > &
    P &
    P1 &
    P2 &
    P3 &
    P4 &
    P5 &
    P6 &
    P7 &
    P8 &
    P9 &
    typeof MongooseKoa;

  static $discriminator<T, P extends ModelClass<T>>(
    cls: P,
    options: mongoose.SchemaOptions = {},
  ): mongoose.Model<mongoose.Document & ModifiedDocument<InstanceType<P>>> &
    P &
    typeof MongooseKoa {
    return this.mongooseManager.discriminator(this as any, cls, options);
  }
}
