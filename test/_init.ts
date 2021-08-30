import * as mongoose from 'mongoose';

before(async () => {
  mongoose.set('setDefaultsOnInsert', false);
  // mongoose.set('debug', true);
  console.log('connecting to database');
  await mongoose.connect('mongodb://localhost:27017/model-mongoose-test', {});
  console.log('connected');
});
