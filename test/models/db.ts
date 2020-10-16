import { User as _User } from './users';
import { mongooseManager } from '../../src';

export namespace db {
  export const User = mongooseManager.register<_User>(_User);
  export type User = _User;
}
