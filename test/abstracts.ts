import 'should';

import { A7Model } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export abstract class AbstractModel<T = any> {
    abstract foo: any;
  }

  @A7Model({})
  export class AbstractFModel {
    foo: AbstractModel;
  }
}

const AbstractFModel = mongooseManager.register(models.AbstractFModel);

describe('abstracts', () => {
  it('returns abstract fields', async () => {
    const metadata = A7Model.getMetadata('AbstractFModel');
    // console.log(metadata);
    metadata.should.have.properties({});
  });
});
