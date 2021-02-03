import * as mongoose from 'mongoose';
import _ from 'underscore';
import { Duration as _Duration, duration, isDuration } from 'moment';

import { BaseSchemaType } from './base-schema-type';

/**
 * This is a very hacky function. In order to save the ISOString to mongodb, we
 * patched the function valueOf() to return the ISOString.
 */
function patchDuration(duration: any): any {
  duration.valueOf = function () {
    return this.toISOString();
  };

  return duration;
}

export class Duration extends BaseSchemaType {
  constructor(path: string, options: any) {
    super(path, options, 'Duration');

    this.validate(this.validateDuration, 'Invalid duration', 'invalid-email');
  }

  validateDuration(val: string) {
    return !!duration(val);
  }

  cast(val: any, options: any): any {
    // update, updateOne provides options as mongoose.Query.
    if (options instanceof mongoose.Query) {
      if (_.isString(val) || _.isNumber(val)) {
        return duration(val).toISOString();
      }
    }

    if (isDuration(val)) {
      return patchDuration(val);
    }

    if (val.constructor !== String) {
      throw new (mongoose.SchemaType as any).CastError(
        'Duration',
        val,
        this.$fullPath,
        `${val} is not a string`,
      );
    }

    if (val != null && !this.validateDuration(val as string)) {
      throw new (mongoose.SchemaType as any).CastError(
        'Duration',
        val,
        this.$fullPath,
        `${val} is not a string`,
      );
    }

    return patchDuration(duration(val as string));
  }
}

declare module 'mongoose' {
  namespace Schema {
    namespace Types {
      let Duration: typeof mongoose.SchemaType;
    }
  }

  namespace Types {
    let Duration: any;
  }
}

mongoose.Schema.Types.Duration = Duration;
mongoose.Types.Duration = String;
