import { PickReadonlyProperties, ReadonlyPropertyNames } from '@ark7/model';

export type DeepPartial<T> = Omit<T, ReadonlyPropertyNames<T>> &
  Partial<PickReadonlyProperties<T>>;
