import * as model from './model';
export declare type TimestampModelType = typeof TimestampModel;
export declare class TimestampModel extends model.Model {
    createdAt?: Date;
    lastUpdateTime?: Date;
}
