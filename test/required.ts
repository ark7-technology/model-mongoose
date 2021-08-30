import * as should from 'should';
import { A7Model, Model } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class TestRequiredModel1 extends Model {
    foo: string;
  }

  @A7Model({})
  export class TestRequiredModel2 extends Model {
    key: string;
    model1?: TestRequiredModel1;
  }
}

const TestRequiredModel2 = mongooseManager.register(models.TestRequiredModel2);
type TestRequiredModel2 =
  mongooseManager.registerModel<models.TestRequiredModel2>;

describe('required', () => {
  beforeEach(async () => {
    await TestRequiredModel2.remove({});
  });

  it('sets correct required value', async () => {
    const v = await TestRequiredModel2.findOneAndUpdate(
      {
        key: 'test1',
      },
      {
        $set: { key: 'test1' },
      },
      { upsert: true, new: true },
    );

    should(v.model1).be.undefined();
  });
});
