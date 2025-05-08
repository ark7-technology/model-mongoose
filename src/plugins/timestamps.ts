import * as mongoose from 'mongoose';
import _ from 'underscore';
import { MongooseOptions } from '../mongoose-manager';
import { MongooseOptionsPlugin } from '../plugin';

export function createdAtPlugin(
  fieldName: string = 'createdAt',
): MongooseOptionsPlugin {
  function setCreatedAtTimeOnSave(next: () => void) {
    if (this.isNew && this[fieldName] == null) {
      this[fieldName] = Date.now();
    }
    next();
  }

  function setCreatedAtTimeOnUpdate(next: () => void) {
    if (this._update?.$set?.createdAt == null) {
      this.updateOne(
        {},
        {
          $setOnInsert: {
            [fieldName]: Date.now(),
          },
        },
      );
    }
    next();
  }

  function setCreatedAtTimeOnInsertMany(
    next: () => void,
    docs: mongoose.Document[],
  ) {
    if (_.isArray(docs) && !_.isEmpty(docs)) {
      _.each(docs, (doc: any) => {
        if (doc[fieldName] == null) {
          doc[fieldName] = Date.now();
        }
      });
    }

    next();
  }

  return (options: MongooseOptions) => {
    (options.mongooseSchema as mongoose.Schema).pre(
      'save',
      setCreatedAtTimeOnSave,
    );
    (options.mongooseSchema as mongoose.Schema).pre(
      'findOneAndUpdate',
      setCreatedAtTimeOnUpdate,
    );
    (options.mongooseSchema as mongoose.Schema).pre(
      'insertMany',
      setCreatedAtTimeOnInsertMany,
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
    this.updateOne(
      {},
      {
        $set: {
          [fieldName]: Date.now(),
        },
      },
    );
    next();
  }

  function setLastUpdateTimeOnInsertMany(
    next: () => void,
    docs: mongoose.Document[],
  ) {
    if (_.isArray(docs) && !_.isEmpty(docs)) {
      _.each(docs, (doc: any) => {
        if (doc[fieldName] == null) {
          doc[fieldName] = Date.now();
        }
      });
    }

    next();
  }

  return (options: MongooseOptions) => {
    (options.mongooseSchema as mongoose.Schema).pre(
      'save',
      setLastUpdateTimeOnSave,
    );
    (options.mongooseSchema as mongoose.Schema).pre(
      'findOneAndUpdate',
      setLastUpdateTimeOnUpdate,
    );
    (options.mongooseSchema as mongoose.Schema).pre(
      'insertMany',
      setLastUpdateTimeOnInsertMany,
    );
  };
}
