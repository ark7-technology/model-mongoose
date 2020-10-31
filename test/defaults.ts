import * as should from 'should';
import { A7Model } from '@ark7/model';

import { Name } from './models';
import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class TestDefaultModel {
    name1: Name;

    name2?: Name;
  }
}

describe('defaults', () => {
  it('returns correct schema with defaults', () => {
    const schema = mongooseManager.getMongooseOptions(models.TestDefaultModel)
      .schema;

    schema.name1.default.should.be.instanceof(Function);
    should(schema.name2.default).be.undefined();
  });
});
