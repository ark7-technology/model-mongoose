// import * as mongoose from 'mongoose';
// import _ from 'underscore';
// import { Duration as _Duration, duration } from 'moment';

// import { BaseSchemaType } from './base-schema-type';

// export class Duration extends BaseSchemaType {
// constructor(path: string, options: any) {
// super(path, options, 'Duration');

// this.validate(this.validateDuration, 'Invalid duration', 'invalid-email');
// }

// validateDuration(val: string) {
// return !!duration(val);
// }

// cast(val: any): any {
// if (val.constructor !== String) {
// throw new (mongoose.SchemaType as any).CastError(
// 'Duration',
// val,
// this.$fullPath,
// `${val} is not a string`,
// );
// }

// if (val != null && !this.validateDuration(val as string)) {
// throw new (mongoose.SchemaType as any).CastError(
// 'Duration',
// val,
// this.$fullPath,
// `${val} is not a string`,
// );
// }

// return duration(val as string);
// }
// }

// declare module 'mongoose' {
// namespace Schema {
// namespace Types {
// let Duration: typeof mongoose.SchemaType;
// }
// }

// namespace Types {
// let Duration: any;
// }
// }

// mongoose.Schema.Types.Duration = Duration;
// mongoose.Types.Duration = String;
