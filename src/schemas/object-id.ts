import _ from 'underscore';
import mongoose from 'mongoose';

mongoose.Schema.Types.ObjectId.cast((v: any) => {
  return v === '' ? null : _.isString(v) ? new mongoose.Types.ObjectId(v) : v;
});
