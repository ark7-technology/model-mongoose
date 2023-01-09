import * as mongoose from 'mongoose';
import _ from 'underscore';

import { MongooseOptions } from './mongoose-manager';

export interface MongooseOptionsPluginSuitable {
  (options: MongooseOptions | mongoose.Model<any>): boolean;

  and(suitable: MongooseOptionsPluginSuitable): MongooseOptionsPluginSuitable;
}

export interface MongooseOptionsPlugin {
  (options: MongooseOptions | mongoose.Model<any>): void;
}

export interface MongooseOptionsPluginOptions {
  suitable?: MongooseOptionsPluginSuitable;
  fn?: MongooseOptionsPlugin;
}

export enum MongoosePluginPeriod {
  BEFORE_REGISTER = 'before-register',
  AFTER_REGISTER = 'after-register',
}

export function createPluginSuitable(
  fn: (options: MongooseOptions) => boolean,
): MongooseOptionsPluginSuitable {
  function suitable(options: MongooseOptions): boolean {
    return fn.call(this, options);
  }

  suitable.and = function (
    suitable: MongooseOptionsPluginSuitable,
  ): MongooseOptionsPluginSuitable {
    return createPluginSuitable(function (options: MongooseOptions): boolean {
      return fn.call(this, options) && suitable.call(this, options);
    });
  };

  return suitable;
}

export const TRUE_SUITABLE = createPluginSuitable(() => true);

export function hasField(fieldName: string): MongooseOptionsPluginSuitable {
  return createPluginSuitable(
    (options: MongooseOptions) => options.fieldNames().indexOf(fieldName) >= 0,
  );
}

export function hasModelName(
  names: string | string[],
): MongooseOptionsPluginSuitable {
  return createPluginSuitable((options: MongooseOptions) =>
    _.isArray(names)
      ? names.indexOf(options.name) >= 0
      : names === options.name,
  );
}
