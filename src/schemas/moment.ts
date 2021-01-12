import * as moment from 'moment';
import * as mongoose from 'mongoose';
import _ from 'underscore';

import { BaseSchemaType } from './base-schema-type';

export class Moment extends BaseSchemaType {
  constructor(path: string, options: any) {
    super(path, options, 'Duration');

    this.validate(this.validateDuration, 'Invalid duration', 'invalid-email');
  }

  validateDuration(val: string) {
    return !!moment(val);
  }

  cast(val: any): any {
    if (val.constructor !== String) {
      throw new (mongoose.SchemaType as any).CastError(
        'Moment',
        val,
        this.$fullPath,
        `${val} is not a string`,
      );
    }

    if (val != null && !this.validateDuration(val as string)) {
      throw new (mongoose.SchemaType as any).CastError(
        'Moment',
        val,
        this.$fullPath,
        `${val} is not a string`,
      );
    }

    return moment(val as string);
  }
}

declare module 'mongoose' {
  namespace Schema {
    namespace Types {
      let Moment: typeof mongoose.SchemaType;
    }
  }

  namespace Types {
    let Moment: any;
  }
}

mongoose.Schema.Types.Moment = Moment;
mongoose.Types.Duration = String;
