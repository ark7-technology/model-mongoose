import 'should';

import { A7Model, Default, Mixin, Model, StrictModel } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class MixinM1 extends StrictModel {
    @Default('foo') foo?: string;
  }

  @A7Model({})
  export class MixinM2 extends StrictModel {
    @Default('bar') bar?: string;
  }

  @A7Model({})
  @Mixin(MixinM1)
  @Mixin(MixinM2)
  export class MixinModel extends Model {}

  export interface MixinModel extends MixinM1, MixinM2 {}
}

const MixinModel = mongooseManager.register(models.MixinModel);

describe('mixin', () => {
  describe('@Default()', () => {
    it('sets default value for a model', async () => {
      const doc = await MixinModel.create({});
      doc.toObject().should.have.properties({
        foo: 'foo',
        bar: 'bar',
      });
    });
  });
});
