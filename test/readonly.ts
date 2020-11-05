import 'should';

import * as mongoose from 'mongoose';
import { A7Model, Model } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class TestReadonlyModel1 extends Model {
    readonly foo: string;
  }

  @A7Model({})
  export class TestReadonlyModel2 extends Model {
    readonly model1: TestReadonlyModel1;
  }
}

describe('readonly', () => {
  it('sets correct mongoose schema', () => {
    mongooseManager
      .getMongooseOptions(models.TestReadonlyModel2)
      .schema.model1.type.should.be.instanceof(mongoose.Schema);
  });
});
