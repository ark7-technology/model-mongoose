import * as should from 'should';
import { A7Model, Model } from '@ark7/model';

import { MongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class MultiTenancyModel extends Model {
    foo: string;
  }
}

let tenancy = 't';

function getTenancy() {
  return tenancy;
}

const manager = new MongooseManager({
  multiTenancy: {
    enabled: true,
    tenants: ['t'],
    tenancyFn: getTenancy,
    uris: 'mongodb://localhost:27017',
    defaultCollectionNamespace: 'public',
  },
});

const MultiTenancyModel = manager.register(models.MultiTenancyModel);

describe('multi-tenancy', () => {
  it('works properly', async () => {
    const m = await MultiTenancyModel.create({
      foo: 'bar',
    });

    const m2 = await MultiTenancyModel.findById(m._id);

    m.toJSON().should.be.deepEqual(m2.toJSON());

    tenancy = 'default';

    const m3 = await MultiTenancyModel.findById(m._id);

    should(m3).be.null();

    const m4 = await MultiTenancyModel.create({
      foo: 'bar2',
    });

    m4.toJSON().foo.should.be.deepEqual('bar2');
  });
});
