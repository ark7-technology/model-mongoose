import * as mongoose from 'mongoose';
import _ from 'underscore';
import { A7Model } from '@ark7/model';

import { MongooseOptions } from '../mongoose-manager';
import { MongooseOptionsPlugin } from '../plugin';

const PopulateOptions = require('mongoose/lib/options/PopulateOptions');

export const dataLevelProjection: MongooseOptionsPlugin = (
  options: MongooseOptions,
) => {
  const metadata = A7Model.getMetadata(options.name);
  metadata.configs.defaultLevel;

  if (options.mongooseSchema instanceof mongoose.Schema) {
    for (const query of preQueries) {
      options.mongooseSchema.pre(
        query,
        function (this: mongoose.Query<any, any> & any, next: () => void) {
          const level = this.options.level ?? metadata.configs.defaultLevel;
          if (level != null) {
            this._fields = this._fields || {};
            this._fields.__v = 1;
            const populates = metadata.dataLevelPopulates(level);

            for (const p of populates.populates) {
              if (this._mongooseOptions.populate == null) {
                this._mongooseOptions.populate = {};
              }

              this._mongooseOptions.populate[p.path] = new PopulateOptions(p);
            }

            _.each(populates.projections, (p) => {
              this._fields[p] = 1;
            });
            delete this.options.level;
          }

          this._userProvidedFields = {};
          next();
        },
      );
    }
  }
};

const preQueries = [
  'find',
  'findOne',
  'count',
  'findOneAndUpdate',
  'findOneAndRemove',
  'update',
];

/**
 * For some reason, QueryCursor cloned the option which carries the level info.
 */
const oldCursor = mongoose.Mongoose.prototype.Query.prototype.cursor;

mongoose.Mongoose.prototype.Query.prototype.cursor = function cursor(
  opts: any,
) {
  const c = oldCursor.call(this, opts);
  delete c.options.level;
  return c;
};
