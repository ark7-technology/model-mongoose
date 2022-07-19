import * as mongoose from 'mongoose';
import _ from 'underscore';

import { BaseSchemaType } from './base-schema-type';

const COMPACT_SSN_REGES = /^\d\d\d\d\d\d\d\d\d/;
const FULL_SSN_REGEX = /^\d\d\d-\d\d-\d\d\d\d$/;

export class SSN extends BaseSchemaType {
  constructor(path: string, options?: any) {
    super(path, options, 'SSN');

    this.validate(this.validateSSN, 'Invalid SSN', 'invalid-ssn');
  }

  validateSSN(val: string) {
    return (
      val == null || COMPACT_SSN_REGES.test(val) || FULL_SSN_REGEX.test(val)
    );
  }

  cast(val: any, options: any) {
    // Allow direct pass of regex in query.
    if (options instanceof mongoose.Query && val instanceof RegExp) {
      return val;
    }

    if (!_.isString(val)) {
      throw new (mongoose.SchemaType as any).CastError(
        'SSN',
        val,
        this.$fullPath,
        `${val} is not a valid SSN`,
      );
    }

    if (COMPACT_SSN_REGES.test(val)) {
      val = `${val.substr(0, 3)}-${val.substr(3, 2)}-${val.substring(5)}`;
    }

    if (!SSN.test(val)) {
      throw new (mongoose.SchemaType as any).CastError(
        'SSN',
        val,
        this.$fullPath,
        `${val} is not a valid SSN`,
      );
    }

    return val;
  }

  static test(val: string): boolean {
    return FULL_SSN_REGEX.test(val);
  }
}

declare module 'mongoose' {
  namespace Schema {
    namespace Types {
      let SSN: typeof mongoose.SchemaType;
    }
  }

  namespace Types {
    let SSN: any;
  }
}

mongoose.Schema.Types.SSN = SSN;
mongoose.Types.SSN = String;
