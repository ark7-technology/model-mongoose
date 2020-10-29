import 'should';

import { A7Model, Default, Model } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class BasicDefaultModel extends Model {
    @Default('foo') foo?: string;
  }
}

const BasicDefaultModel = mongooseManager.register(models.BasicDefaultModel);

describe('basics', () => {
  describe('@Default()', () => {
    it('sets default value for a model', async () => {
      const doc = await BasicDefaultModel.create({});

      doc.foo.should.be.equal('foo');
    });
  });
});
