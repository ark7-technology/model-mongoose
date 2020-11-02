import { Field, FieldOptions } from '@ark7/model';
import { ModelUpdateOptions, SaveOptions, SchemaTypes } from 'mongoose';

declare module '@ark7/model/core/model' {
  export interface Model {
    /**
     * Explicitly executes population and returns a promise.
     * Useful for ES2015 integration.
     * @returns promise that resolves to the document when population is done
     */
    execPopulate(): Promise<this>;

    /** Checks if path was explicitly selected. If no projection, always returns true. */
    isDirectSelected(path: string): boolean;

    /**
     * Returns the value of a path.
     * @param type optionally specify a type for on-the-fly attributes
     * @param options
     * @param options.virtuals apply virtuals before getting this path
     * @param options.getters if false, skip applying getters and just get the raw value
     */
    get(
      path: string,
      type?: any,
      options?: {
        virtuals?: boolean;
        getters?: boolean;
      },
    ): any;

    /** Returns true if path was directly set and modified, else false. */
    isDirectModified(path: string): boolean;

    /** Checks if path was initialized */
    isInit(path: string): boolean;

    /**
     * Returns true if this document was modified, else false.
     * If path is given, checks if a path or any full path containing path as part of its path
     * chain has been modified.
     */
    isModified(path?: string): boolean;

    /** Checks if path was selected in the source query which initialized this document. */
    isSelected(path: string): boolean;
    /**
     * Marks the path as having pending changes to write to the db.
     * Very helpful when using Mixed types.
     * @param path the path to mark modified
     */
    markModified(path: string): void;

    /** Returns the list of paths that have been modified. */
    modifiedPaths(): string[];

    /**
     * Gets _id(s) used during population of the given path. If the path was not
     * populated, undefined is returned.
     */
    populated(path: string): any;

    /**
     * Sets the value of a path, or many paths.
     * @param path path or object of key/vals to set
     * @param val the value to set
     * @param type optionally specify a type for "on-the-fly" attributes
     * @param options optionally specify options that modify the behavior of the set
     */
    set(path: string, val: any, options?: any): this;
    set(path: string, val: any, type: any, options?: any): this;
    set(value: any): this;

    save(options?: SaveOptions): Promise<this>;

    /**
     * Sends an replaceOne command with this document _id as the query selector.
     */
    replaceOne(replacement: any): Promise<this>;

    /**
     * Sends an update command with this document _id as the query selector.
     */
    update(doc: any, options?: ModelUpdateOptions): Promise<this>;

    /**
     * Sends an updateOne command with this document _id as the query selector.
     */
    updateOne(doc: any, options?: ModelUpdateOptions): Promise<this>;
  }
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
