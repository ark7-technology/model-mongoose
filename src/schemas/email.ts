import * as mongoose from 'mongoose';
import _ from 'underscore';

import { BaseSchemaType } from './base-schema-type';

export class Email extends BaseSchemaType {
  constructor(path: string, options: any) {
    super(path, options, 'Email');

    this.validate(this.validateEmail, 'Invalid email address', 'invalid-email');
  }

  validateEmail(val: string) {
    return /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(val);
  }

  cast(val: any, options :any) {
    // Allow direct pass of regex in query.
    if (options instanceof mongoose.Query && val instanceof RegExp) {
      return val;
    }
    
    if (val.constructor !== String) {
      throw new (mongoose.SchemaType as any).CastError(
        'Email',
        val,
        this.$fullPath,
        `${val} is not a string`,
      );
    }

    if (val != null && !this.validateEmail(val as string)) {
      throw new (mongoose.SchemaType as any).CastError(
        'Email',
        val,
        this.$fullPath,
        `${val} is not a string`,
      );
    }

    return val;
  }
}

declare module 'mongoose' {
  namespace Schema {
    namespace Types {
      let Email: typeof mongoose.SchemaType;
    }
  }

  namespace Types {
    let Email: any;
  }
}

mongoose.Schema.Types.Email = Email;
mongoose.Types.Email = String;
