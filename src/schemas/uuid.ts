import * as mongoose from 'mongoose';
import _ from 'underscore';
import validator from 'validator';

import { BaseSchemaType } from './base-schema-type';

export class UUID extends BaseSchemaType {
  constructor(path: string, options: any) {
    super(path, options, 'UUID');

    function validateUUID(val: string) {
      return validator.isUUID(val);
    }
    this.validate(validateUUID, '`{PATH}` is not a valid uuid', 'invalid-uuid');
  }

  cast(val: any) {
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
      let UUID: typeof mongoose.SchemaType;
    }
  }

  namespace Types {
    let UUID: any;
  }
}

mongoose.Schema.Types.UUID = UUID;
mongoose.Types.UUID = String;
