import { ParamError } from './params';

export type Validator = (
  target: any,
  path: string | number,
  val: any,
  root: any,
) => boolean | string | ParamError | ParamError[];
