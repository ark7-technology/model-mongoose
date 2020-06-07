import { DocumentToObjectOptions } from 'mongoose';
import * as model from './model';
import { AsObject } from './types';
export declare type DataLevelModelType = typeof DataLevelModel;
export declare class DataLevelModel extends model.DocumentModel {
    toJSON(options?: DocumentToObjectOptions): AsObject<this>;
}
export declare function Level(level: string, schema?: any): PropertyDecorator;
