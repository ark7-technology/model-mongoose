import * as mongoose from 'mongoose';

// import { sbaseMongooseConfig } from '../src/mongoose';

mongoose.connect('mongodb://localhost:27017/model-mongoose-test', {});
// mongoose.set('debug', true);

// sbaseMongooseConfig.multiTenancy.uris = 'mongodb://localhost:27017/test';
// sbaseMongooseConfig.multiTenancy.options = {
// useNewUrlParser: true,
// useUnifiedTopology: true,
// };
// sbaseMongooseConfig.multiTenancy.enabled = true;
// sbaseMongooseConfig.multiTenancy.defaultCollectionNamespace = 'public';
// sbaseMongooseConfig.multiTenancy.tenants = ['mtTest'];

// sbaseMongooseConfig.multiTenancy.onMongooseInstanceCreated = (mi) => {
// };
