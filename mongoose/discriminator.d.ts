import { Document } from 'mongoose';
import { A7ModelType } from './a7-model';
import { ConvertModel } from './types';
import { DocumentModel, Model } from './model';
export declare class Discriminator extends DocumentModel {
    static $discriminator<T extends ConvertModel<Document, any> & typeof Discriminator, M extends typeof Model>(this: T, m: M): ConvertModel<T & InstanceType<M> & Document, T & InstanceType<M>> & T & M;
    static $discriminatorA7Model<T extends ConvertModel<Document, any> & typeof Discriminator, M extends typeof Model>(this: T, m: M): ConvertModel<T & InstanceType<M> & Document, T & InstanceType<M>> & T & M & A7ModelType;
}
