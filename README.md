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
