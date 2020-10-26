import 'should';

import { A7Model, MMap, Model } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class TestMap extends Model {
    s?: MMap<number>;
  }
}

const TestMap = mongooseManager.register(models.TestMap);

describe('maps', () => {
  it('should save map fields', async () => {
    const v = await TestMap.create({
      s: {
        foo: 1,
      },
    });

    v.toJSON().should.be.have.properties({
      s: {
        foo: 1,
      },
    });
  });
});
