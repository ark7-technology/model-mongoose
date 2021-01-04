import * as _ from 'underscore';
import * as should from 'should';
import { A7Model, MMap, Model, StrictModel } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({
    discriminatorKey: 'foo',
  })
  export class TestMap2 extends StrictModel {
    foo?: string;
  }

  @A7Model({})
  export class TestMap extends Model {
    s?: MMap<number>;

    s2?: MMap<TestMap2>;
  }
}

const TestMap = mongooseManager.register(models.TestMap);

describe('maps', () => {
  it('should save map fields', async () => {
    const v = await TestMap.create({
      s: {
        foo: 1,
      } as any,
    });

    _.omit(v.toJSON(), '_id').should.be.have.properties({
      s: {
        foo: 1,
      },
    });
  });

  it('should load nested map fields', async () => {
    const v = await TestMap.create({
      s2: {
        key1: {
          foo: 'bar',
        },
      } as any,
    });

    const v1 = v.s2.get('key1');

    (v1 as any).__proto__ = {};

    // should(v1.foo).be.undefined();
    // console.log(v1, (v1 as any)._doc);
    // (v1 as any)._doc.foo.should.be.equals('bar');
  });
});
