import * as mongoose from 'mongoose';
import _ from 'underscore';

mongoose.Schema.Types.ObjectId.cast((v: any) => {
  return v === '' ? null : _.isString(v) ? new mongoose.Types.ObjectId(v) : v;
});
