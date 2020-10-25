import * as mongoose from 'mongoose';
import { Model } from '@ark7/model';

export class MongooseModel extends Model {
  public static cast<D extends mongoose.Document>(): mongoose.Model<D> {
    return (this as any)._proxy || this;
  }
}
