import * as _ from 'underscore';
import * as should from 'should';
import { A7Model, Model, NoPersist } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class NoPersistModel extends Model {
    @NoPersist() foo?: string;
  }
}

const NoPersistModel = mongooseManager.register(models.NoPersistModel);

describe('no-persist', () => {
  it('do not set no-persist value', async () => {
    const doc = await NoPersistModel.create({ foo: 'foo' });

    should(doc.foo).be.undefined();

    doc.foo = 'bar';

    _.omit(doc.toJSON(), '_id').should.be.deepEqual({
      foo: 'bar',
    });
  });
});
