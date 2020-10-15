import { Field, FieldOptions } from '@ark7/model';
import { SchemaTypes } from 'mongoose';

export type MongooseRequiredOptions = FieldOptions<{
  required?: boolean | Function;
}>;

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

export type MongooseArrayOptions = FieldOptions<{
  type: [any];
  default?: any;
}>;

export interface ValidateOptions {
  validator: () => boolean | Promise<boolean>;
  message: string | ((props: { value: any }) => string);
}

export type MongooseValidatorOptions = FieldOptions<{
  validate: ValidateOptions;
}>;

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
  | MongooseRequiredOptions
  | MongooseIndexOptions
  | MongooseDefaultOptions
  | MongooseMapOptions
  | MongooseDBRefOptions;

export function Required(
  required: boolean | Function = true,
): PropertyDecorator {
  return Field<MongooseFieldOption>({ required });
}

export function Optional(): PropertyDecorator {
  return Field();
}

export function Index(options: { unique?: boolean } = {}): PropertyDecorator {
  return Field<MongooseIndexOptions>({
    index: true,
    unique: options.unique || false,
  });
}

export function Unique(): PropertyDecorator {
  return Index({ unique: true });
}

export function Default(value: any): PropertyDecorator {
  return Field<MongooseDefaultOptions>({ default: value });
}

export function MapField(type: any): PropertyDecorator {
  return Field<MongooseMapOptions>({
    type: Map,
    of: type,
  });
}

export function ArrayField(type: any): PropertyDecorator {
  return Field<MongooseArrayOptions>({
    type: [type],
    default: [],
  });
}

export function Validate(options: ValidateOptions): PropertyDecorator {
  return Field<MongooseValidatorOptions>({
    validate: options,
  });
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
