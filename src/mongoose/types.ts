import { Model } from './model';

type OrdinaryFields = '_id' | 'createdAt' | 'lastUpdateTime';

type AsObjectSingle<T extends Model> = Omit<
  T,
  Exclude<keyof A7Model, OrdinaryFields>
>;

export type AsObject<T extends Model> = {
  [key in keyof AsObjectSingle<Omit<T, OrdinaryFields>>]: T[key];
} &
  Partial<Pick<T, OrdinaryFields & keyof T>>;

export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type AsObjectPartial<T extends Model> = DeepPartial<AsObject<T>>;

export interface A7Model {}
