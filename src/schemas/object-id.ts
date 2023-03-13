import * as mongoose from 'mongoose';
import _ from 'underscore';

mongoose.Schema.Types.ObjectId.cast((v: any) => {
  return v == null || v === ''
    ? null
    : _.isString(v)
    ? new mongoose.Types.ObjectId(v)
    : v._id != null
    ? _.isString(v._id)
      ? new mongoose.Types.ObjectId(v._id)
      : v._id
    : v;
});
