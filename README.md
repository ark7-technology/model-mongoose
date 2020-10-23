# @ark7/model-mongoose

@ark7/model-mongoose is a mongodb adaptor for
[@ark7/model](https://github.com/ark7-technology/model).

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

import { Post as _Post, User as _User } from './models';

export namespace db {
  export const User = mongooseManager.register<_User>(_User);
  export type User = _User;

  export const Post = mongooseManager.register<_Post>(_Post);
  export type Post = _Post;
}
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
