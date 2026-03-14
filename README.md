# @ark7/model-mongoose

@ark7/model-mongoose is a mongodb adaptor for
[@ark7/model](https://github.com/ark7-technology/model).

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Define Models](#define-models)
  - [Register Models](#register-models)
    - [Mongoose Configurations](#mongoose-configurations)
  - [Usage](#usage)
- [Advanced Features](#advanced-features)
  - [Cross-Database Population](#cross-database-population)
  - [Field Index](#field-index)
  - [Compound Index](#compound-index)
  - [Timestamp Plugins](#timestamp-plugins)

## Installation

Install the dependencies package:

```shell
$ npm install @ark7/model-mongoose
```

Add transform plugin to tsconfig.json:

```
// tsconfig.json

{
  ...
  "plugins": [{
    "transform": "@ark7/model/transformer"
  }],
}
```

## Quick Start

### Define Models

```typescript
// models/names.ts

import { A7Model, StrictModel } from '@ark7/model';
import { Validate } from '@ark7/model-mongoose';

@A7Model({})
export class Name extends StrictModel {
  @Validate({ minlength: 5 })
  first: string;

  middle?: string;

  last: string;

  get fullname(): string {
    return this.first + ' ' + this.last;
  }

  greeting(): string {
    return `Hello, ${this.fullname}`;
  }
}

// models/users.ts

import { A7Model, Model, Ref } from '@ark7/model';

import { Name } from './names';
import { Post } from './posts';

@A7Model({})
export class User extends Model {
  name: Name;

  posts: Ref<Post>[];
}

// models/posts.ts
import { A7Model, Model, Ref } from '@ark7/model';

import { User } from './users';

@A7Model({})
export class Post extends Model {
  topic: string;

  author: Ref<User>;
}
```

### Register Models

```typescript
// db.ts

import { mongooseManager } from '@ark7/model-mongoose';

import * as models from './models';

export namespace db {
  export const User = mongooseManager.register(models.User);
  export type User = models.User;

  export const Post = mongooseManager.register(models.Post);
  export type Post = models.Post;
}
```

#### Mongoose Configurations

Set [mongoose configurations](https://mongoosejs.com/docs/api/schema.html) like
`collection name`, `capped`, etc.

```typescript
// db.ts

import { mongooseManager } from '@ark7/model-mongoose';

import * as models from './models';

export const User = mongooseManager.register(models.User, {
  collection: 'users',
});
export type User = models.User;
```

### Usage

```typescript
const x = await db.User.create({
  name: {
    first: 'fff',
    last: 'wang',
  },
  posts: [],
});

x.name.fullname.should.be.equals('fff wang');

const y = await db.User.findById(x._id);

y.name.fullname.should.be.equals('fff wang');
```

## Advanced Features

### Cross-Database Population

When models live on separate databases (separate `MongooseManager` instances),
`populate()` cannot resolve `Ref<>` fields across connections by default. Use
`linkModels()` to register one manager's models into another manager's
connection so that cross-database population works.

```typescript
import { Mongoose } from 'mongoose';
import { MongooseManager } from '@ark7/model-mongoose';

const coreMongoose = new Mongoose();
await coreMongoose.connect('mongodb://localhost:27017/core-db');
const coreManager = new MongooseManager(coreMongoose);

const analyticsMongoose = new Mongoose();
await analyticsMongoose.connect('mongodb://localhost:27017/analytics-db');
const analyticsManager = new MongooseManager(analyticsMongoose);

// Register models on their respective managers
const User = coreManager.register(UserModel);
const Report = analyticsManager.register(ReportModel);

// Make core models visible to the analytics manager so that
// Report.find().populate('author') can resolve User refs.
analyticsManager.linkModels(coreManager);
```

`linkModels` resolves all lazy proxies in the source manager before copying,
so callers don't need to pre-resolve models. It also works with multi-tenancy
setups, copying models into each tenant's connection.

### Default

```typescript
@A7Model({})
export class BasicDefaultModel {
  @Default('foo') foo?: string;
}
```

### Readonly

### Data Level

### Field Index

```typescript
@A7Model({})
export class User {
  @Unique()
  email: string;

  // Sometimes the field is optional.
  @Unique({ sparse: true })
  token: string;

  // If the field is not unique.
  @Index()
  name: string;
}
```

### Compound Index

```typescript
@A7Model({})
@CompoundIndex({ user: 1, date: 1 }, { unique: true })
export class Order {
  user: Ref<User>;
  date: Date;
}
```

### Timestamp Plugins

```typescript
// models/base.ts

class BaseModel {
  createdAt?: Date;
  lastUpdateTime?: Date;
}

// models/users.ts
@A7Model({})
export class User extends BaseModel {
  name: Name;
}

// db.ts

import { mongooseManager } from '@ark7/model-mongoose';
import {
  createdAtPlugin,
  lastUpdateTimePlugin,
} from '@ark7/model-mongoose/plugins/timestamps';

import { User as _User } from './models';

mongooseManager.plugin(MongoosePluginPeriod.BEFORE_REGISTER, createdAtPlugin());
mongooseManager.plugin(
  MongoosePluginPeriod.BEFORE_REGISTER,
  lastUpdateTimePlugin(),
);

export namespace db {
  export const User = mongooseManager.register<_User>(_User);
  export type User = _User;
}
```

### Multi-tenancy

`@ark7/model` supports to have multi-tenancies living in the same database. For
example, separating production, staging, and sandbox, environment.

```typescript
import { mongooseManager } from '@ark7/model-mongoose';

mongooseManager.set('multiTenancy', {
  enabled: true,
  tenants: ['test', 'staging', 'sandbox'],
  tenancyFn: getTenancy,
  uris: 'mongodb://localhost:27017',
  defaultCollectionNamespace: 'public',
});
```
