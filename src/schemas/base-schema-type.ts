import * as mongoose from 'mongoose';

export class BaseSchemaType extends mongoose.SchemaType {
  path: string;
  instance: string;
  $fullPath: string;
}
