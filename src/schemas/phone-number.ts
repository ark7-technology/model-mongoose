import * as googleLibPhoneNumber from 'google-libphonenumber';
import * as mongoose from 'mongoose';
import _ from 'underscore';

import { BaseSchemaType } from './base-schema-type';

const phoneUtil = googleLibPhoneNumber.PhoneNumberUtil.getInstance();

export class PhoneNumber extends BaseSchemaType {
  constructor(path: string, options: any) {
    super(path, options, 'PhoneNumber');

    this.validate(
      this.validatePhoneNumber,
      'Invalid phone number',
      'invalid-phone-number',
    );
  }

  validatePhoneNumber(val: string) {
    if (val == null) {
      return true;
    }

    const valid = phoneUtil.isValidNumberForRegion(
      phoneUtil.parseAndKeepRawInput(val),
      'US',
    );
    return valid;
  }

  cast(val: any, options: any) {
    // Allow direct pass of regex in query.
    if (options instanceof mongoose.Query && val instanceof RegExp) {
      return val;
    }

    if (val.constructor !== String) {
      throw new (mongoose.SchemaType as any).CastError(
        'PhoneNumber',
        val,
        this.$fullPath,
        `${val} is not a string`,
      );
    }

    if (val != null && !this.validatePhoneNumber(val as string)) {
      throw new (mongoose.SchemaType as any).CastError(
        'PhoneNumber',
        val,
        this.$fullPath,
        `${val} is not a string`,
      );
    }

    return phoneUtil.format(
      phoneUtil.parseAndKeepRawInput(val as string),
      googleLibPhoneNumber.PhoneNumberFormat.INTERNATIONAL,
    );
  }
}

declare module 'mongoose' {
  namespace Schema {
    namespace Types {
      let PhoneNumber: typeof mongoose.SchemaType;
    }
  }

  namespace Types {
    let PhoneNumber: any;
  }
}

mongoose.Schema.Types.PhoneNumber = PhoneNumber;
mongoose.Types.PhoneNumber = String;
