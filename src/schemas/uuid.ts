import * as mongoose from 'mongoose';
import _ from 'underscore';

import { BaseSchemaType } from './base-schema-type';

// RFC 9562 format check without enforcing version or variant nibbles.
// The `validator` npm package's isUUID() enforces strict variant bits
// ([89ab] in the first nibble of group 4), but AWS Cognito generates
// UUID sub values with variant nibble '2' that are valid identifiers
// but fail the strict check. Use a loose hex format match instead.
const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class StringUUID extends BaseSchemaType {
  constructor(path: string, options: any) {
    super(path, options, 'UUID');

    function validateUUID(val: string) {
      return UUID_FORMAT.test(val);
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
