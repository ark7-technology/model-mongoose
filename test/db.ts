import { Post as _Post, User as _User } from './models';
import { mongooseManager } from '../src';

export namespace db {
  export const User = mongooseManager.register(_User);
  export type User = _User;

  export const Post = mongooseManager.register(_Post);
  export type Post = _Post;
}
