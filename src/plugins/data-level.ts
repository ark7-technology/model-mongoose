import * as mongoose from 'mongoose';
import _ from 'underscore';
import { A7Model } from '@ark7/model';

import { MongooseOptions } from '../mongoose-manager';
import { MongooseOptionsPlugin } from '../plugin';

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
            _.each(metadata.dataLevelPopulates(level).projections, (p) => {
              this._fields[p] = 1;
            });
          }

          next();
        },
      );
    }
  }
};

const preQueries: any[] = [
  'find',
  'findOne',
  'count',
  'findOneAndUpdate',
  'findOneAndRemove',
  'update',
];
