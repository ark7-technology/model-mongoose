import * as model from './model';
export declare type SoftDeleteModelType = typeof SoftDeleteModel;
export declare class SoftDeleteModel extends model.DocumentModel {
    deleted: boolean;
    delete(): Promise<this>;
}
