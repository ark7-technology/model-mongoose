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
