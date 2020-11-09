import * as mongoose from 'mongoose';
import { Field, FieldOptions } from '@ark7/model';
import { SchemaTypes } from 'mongoose';

declare module '@ark7/model/core/model' {
  export interface Model
    extends Omit<mongoose.Document, 'toJSON' | 'toObject' | '_id'> {}
}

export type MongooseIndexOptions = FieldOptions<{
  index?: boolean;
  unique?: boolean;
}>;

export type MongooseDefaultOptions = FieldOptions<{
  default?: any;
}>;

export type MongooseMapOptions = FieldOptions<{
  type: typeof Map;
  of: any;
}>;

export interface CustomizedValidate {
  validator: () => boolean | Promise<boolean>;
  message:
    | string
    | ((props: { type: string; path: string; value: any }) => string);
}

export interface CustomizedValidatorOptions {
  validate: CustomizedValidate;
}

export interface NumberValidatorOptions {
  min?: number;
  max?: number;
}

export interface StringValidatorOptions {
  enum?: object[];
  match?: RegExp;
  minlength?: number;
  maxlength?: number;
}

export type ValidateOptions =
  | CustomizedValidate
  | NumberValidatorOptions
  | StringValidatorOptions;

export type MongooseValidatorOptions = FieldOptions<
  CustomizedValidatorOptions | NumberValidatorOptions | StringValidatorOptions
>;

export function isCustomizedValidatorOptions(
  options: ValidateOptions,
): options is CustomizedValidate {
  return (options as CustomizedValidate).validator != null;
}

export type EnumOptions = string[];

export type MongooseEnumOptions = FieldOptions<{
  type: typeof String;
  enum: string[];
}>;

export type MongooseDBRefOptions = FieldOptions<{
  type: typeof SchemaTypes.ObjectId;
  ref: string;
}>;

export type MongooseFieldOption =
  | MongooseIndexOptions
  | MongooseDefaultOptions
  | MongooseMapOptions
  | MongooseDBRefOptions;

export function MapField(type: any): PropertyDecorator {
  return Field<MongooseMapOptions>({
    type: Map,
    of: type,
  });
}

export function ArrayField(type: any): PropertyDecorator {
  return Field({
    type: [type],
    default: [],
  });
}

export function Validate(options: ValidateOptions): PropertyDecorator {
  return Field<MongooseValidatorOptions>(
    isCustomizedValidatorOptions(options) ? { validate: options } : options,
  );
}

export function Enum(options: EnumOptions): PropertyDecorator {
  return Field<MongooseEnumOptions>({
    type: String,
    enum: options,
  });
}

export function DBRef(modelName: string): PropertyDecorator {
  return Field<MongooseDBRefOptions>({
    type: SchemaTypes.ObjectId,
    ref: modelName,
  });
}

export function DBRefArray(modelName: string): PropertyDecorator {
  return ArrayField({
    type: SchemaTypes.ObjectId,
    ref: modelName,
  });
}
