import * as mongoose from 'mongoose';

import { MongooseOptions } from '../mongoose-manager';
import { MongooseOptionsPlugin } from '../plugin';

export function createdAtPlugin(
  fieldName: string = 'createdAt',
): MongooseOptionsPlugin {
  function setCreatedAtTimeOnSave(next: () => void) {
    if (this[fieldName] == null) {
      this[fieldName] = Date.now();
    }
    next();
  }

  function setCreatedAtTimeOnUpdate(next: () => void) {
    this.update(
      {},
      {
        $setOnInsert: {
          [fieldName]: Date.now(),
        },
      },
    );
    next();
  }

  return (options: MongooseOptions) => {
    (options.mongooseSchema as mongoose.Schema).pre(
      'save',
      setCreatedAtTimeOnSave,
    );
    (options.mongooseSchema as mongoose.Schema).pre(
      'updateOne',
      setCreatedAtTimeOnUpdate,
    );
  };
}

export function lastUpdateTimePlugin(
  fieldName: string = 'lastUpdateTime',
): MongooseOptionsPlugin {
  function setLastUpdateTimeOnSave(next: () => void) {
    this[fieldName] = Date.now();
    next();
  }

  function setLastUpdateTimeOnUpdate(next: () => void) {
    this.update(
      {},
      {
        $set: {
          [fieldName]: Date.now(),
        },
      },
    );
    next();
  }

  return (options: MongooseOptions) => {
    (options.mongooseSchema as mongoose.Schema).pre(
      'save',
      setLastUpdateTimeOnSave,
    );
    (options.mongooseSchema as mongoose.Schema).pre(
      'updateOne',
      setLastUpdateTimeOnUpdate,
    );
  };
}
