import * as mongoose from 'mongoose';
import _ from 'underscore';
import {
  A7Model,
  Ark7ModelMetadata,
  Manager,
  Model,
  manager as _manager,
} from '@ark7/model';

@A7Model({})
export class MongooseModel extends Model {
  public static cast<D extends mongoose.Document>(): mongoose.Model<D> {
    return (this as any)._proxy || this;
  }

  public static getMetadata(manager: Manager = _manager): Ark7ModelMetadata {
    return manager.getMetadata(
      this.prototype instanceof mongoose.Model ? (this as any).modelName : this,
    );
  }
}
