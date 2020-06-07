import 'reflect-metadata';
import { Document as MDocument, DocumentToObjectOptions, Model as MModel, Mongoose, Schema, SchemaOptions } from 'mongoose';
import { MongoError } from 'mongodb';
import { A7ModelType } from './a7-model';
import { AsObject, AsObjectPartial, ConvertModel } from './types';
import { SBaseMongooseConfig } from './model-config';
export declare type ModelType = typeof Model;
export declare type IModel<E extends DocumentModel> = MModel<E>;
export interface Document extends MDocument {
    toJSON(options?: DocumentToObjectOptions): AsObject<this>;
}
export interface Model {
    toJSON(options?: DocumentToObjectOptions): AsObject<this>;
}
/**
 * Wrapped Model from mongoose.Model.
 */
export declare class Model {
    static modelize<T extends new (...args: any[]) => any>(this: T, o: AsObjectPartial<InstanceType<T>>): InstanceType<T>;
    static Schema(schema: Schema): ModelType;
    static Config(config: SchemaOptions): ModelType;
    static Pre(pre: Pre): ModelType;
    static Post(post: Post): ModelType;
    static Virtual(virtual: Virtual): ModelType;
    static Plugin(plugin: Plugin): ModelType;
    static Index(index: Index): ModelType;
    static Mixin(model: ModelType): ModelType;
    static UpdateValidator(validate: UpdateValidator): ModelType;
    static $mongooseOptions(sbaseConfig?: SBaseMongooseConfig, tenancy?: string): MongooseOptions;
    static $register<T extends ModelType>(this: T, mongooseInstance?: Mongoose): ConvertModel<InstanceType<T> & Document, InstanceType<T>> & T;
    static $registerA7Model<T extends ModelType>(this: T, mongooseInstance?: Mongoose): ConvertModel<InstanceType<T> & Document, InstanceType<T>> & T & A7ModelType;
}
export declare const lazyFns: string[];
export declare const shareFns: string[];
export interface DocumentModel extends Document {
}
export declare class DocumentModel extends Model {
    static cast<D extends DocumentModel>(): IModel<D>;
}
export declare function Enum(e: any, schema?: any): PropertyDecorator;
export declare function DBRef(ref: string, schema?: any): PropertyDecorator;
export declare function DBRefArray(ref: string, schema?: any): PropertyDecorator;
export declare function ArrayField(type: any, schema?: any): PropertyDecorator;
export declare function Required(opt?: boolean | (() => boolean | Promise<boolean>), schema?: any): PropertyDecorator;
export declare function IndexField(schema?: any): PropertyDecorator;
export declare function Unique(schema?: any): PropertyDecorator;
export declare function Default(defaultValue: any, schema?: any): PropertyDecorator;
export declare function MapField(type: any, schema?: any): PropertyDecorator;
export declare function Optional(schema?: any): PropertyDecorator;
export declare function Validate(validator: Validator, schema?: any): PropertyDecorator;
export declare function Field(schema?: any): PropertyDecorator;
export declare function Mixin(model: ModelType): <T extends new (...args: any[]) => {}>(constructor: T) => void;
export declare function Config(config: SchemaOptions): <T extends new (...args: any[]) => {}>(constructor: T) => void;
export declare function Plugin(plugin: Plugin): <T extends new (...args: any[]) => {}>(constructor: T) => void;
export declare function Pre(pre: Pre): <T extends new (...args: any[]) => {}>(constructor: T) => void;
export declare function Pres(names: string[], pre: PPre): <T extends new (...args: any[]) => {}>(constructor: T) => void;
export declare function Virtual(options: VirtualOptions): (target: any, propertyName: string) => void;
export declare function Post(post: Post): <T extends new (...args: any[]) => {}>(constructor: T) => void;
export declare function Posts(names: string[], post: PPost): <T extends new (...args: any[]) => {}>(constructor: T) => void;
export declare function Index(index: Index): <T extends new (...args: any[]) => {}>(constructor: T) => void;
export declare function UpdateValidator(validate: UpdateValidator): <T extends new (...args: any[]) => {}>(constructor: T) => void;
/**
 * Mongoose options for current model.
 */
export interface MongooseOptions {
    config?: SchemaOptions;
    schema?: {};
    mongooseSchema?: Schema;
    pres?: Pre[];
    posts?: Post[];
    virtuals?: Virtual[];
    methods?: Method[];
    statics?: Method[];
    plugins?: Plugin[];
    indexes?: Index[];
    updateValidators?: UpdateValidator[];
}
export interface MongooseOptionsMap {
    [key: string]: MongooseOptions;
}
export interface Pre {
    name: string;
    fn: (next: (err?: NativeError) => void) => void;
    parallel?: boolean;
    errorCb?: (err: Error) => void;
}
export interface PPre {
    fn: (next: (err?: NativeError) => void) => void;
    parallel?: boolean;
    errorCb?: (err: Error) => void;
}
export interface Post {
    name: string;
    fn: PostFn1 | PostFn2;
}
export interface PPost {
    fn: PostFn1 | PostFn2;
}
export declare type PostFn1 = (doc: object, next: (err?: NativeError) => void) => void;
export declare type PostFn2 = (error: MongoError, doc: object, next: (err?: NativeError) => void) => void;
export interface Virtual {
    name: string;
    get?: () => any;
    set?: (val?: any) => void;
    options?: VirtualOptions;
}
export interface Method {
    name: string;
    fn: () => void;
}
export interface Plugin {
    fn: (schema: Schema, options?: object) => void;
    options?: object;
    priority?: number;
}
export interface Index {
    fields: object;
    options?: {
        expires?: string;
        [other: string]: any;
    };
}
export interface Validator {
    validator: (v: any) => any;
    message: string | ((props: {
        value: any;
    }) => string);
}
export interface UpdateValidator {
    path: string;
    fn: (val?: any) => boolean;
    errorMsg?: string;
    type?: string;
}
export interface VirtualOptions {
    ref: string;
    localField: string;
    foreignField: string;
    justOne?: boolean;
    options?: any;
    count?: boolean;
    match?: object;
}
export declare class NativeError extends global.Error {
}
export declare const preQueries: string[];
export declare function combineValidator<T>(fn: (this: T, _v: any) => boolean | Promise<boolean>): () => boolean | Promise<boolean>;
