import * as mongoose from 'mongoose';
import _ from 'underscore';
import validator from 'validator';

import { BaseSchemaType } from './base-schema-type';

export class StringUUID extends BaseSchemaType {
  constructor(path: string, options: any) {
    super(path, options, 'UUID');

    function validateUUID(val: string) {
      return validator.isUUID(val);
    }
    this.validate(validateUUID, '`{PATH}` is not a valid uuid', 'invalid-uuid');
  }

  cast(val: any, options: any) {
    // Allow direct pass of regex in query.
    if (options instanceof mongoose.Query && val instanceof RegExp) {
      return val;
    }

    if (val.constructor !== String) {
      throw new (mongoose.SchemaType as any).CastError(
        'UUID',
        val,
        this.$fullPath,
        `${val} is not a valid UUID`,
      );
    }
    return val;
  }
}

declare module 'mongoose' {
  namespace Schema {
    namespace Types {
      let StringUUID: typeof mongoose.SchemaType;
    }
  }

  namespace Types {
    let StringUUID: any;
  }
}

mongoose.Schema.Types.StringUUID = StringUUID;
mongoose.Types.StringUUID = String;
