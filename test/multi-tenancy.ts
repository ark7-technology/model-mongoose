import * as should from 'should';
import { A7Model } from '@ark7/model';

import { DiscriminateMongooseModel, MongooseManager } from '../src';

namespace models {
  @A7Model({
    discriminatorKey: 'kind',
  })
  export class MultiTenancyModel extends DiscriminateMongooseModel {
    kind?: string;
    foo: string;
  }

  @A7Model({})
  export class MultiTenancyModel2 extends MultiTenancyModel {
    bar: string;
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

const MultiTenancyModel2 = MultiTenancyModel.$discriminator(
  models.MultiTenancyModel2,
);

describe('multi-tenancy', () => {
  it('works properly', async () => {
    tenancy = 't';

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

  it('works properly with discriminator', async () => {
    tenancy = 't';

    const m = await MultiTenancyModel2.create({
      foo: 'bar',
      bar: 'foo',
    });

    const m2 = await MultiTenancyModel.findById(m._id);

    m.toJSON().should.be.deepEqual(m2.toJSON());

    tenancy = 'default';

    const m3 = await MultiTenancyModel.findById(m._id);

    should(m3).be.null();

    const m4 = await MultiTenancyModel2.create({
      foo: 'bar2',
      bar: 'foo2',
    });

    m4.toJSON().foo.should.be.deepEqual('bar2');
  });
});
