import 'should';

import { A7Model, Default, Mixin, Model, StrictModel } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class MixinM1 extends StrictModel {
    @Default('foo') foo?: string;

    hello() {
      return 'world';
    }
  }

  @A7Model({})
  export class MixinM3 extends StrictModel {
    static hello3() {
      return 'world3';
    }
  }

  @A7Model({})
  @Mixin(MixinM3)
  export class MixinM2 extends StrictModel {
    @Default('bar') bar?: string;

    static hello2() {
      return 'world2';
    }
  }

  @A7Model({})
  @Mixin(MixinM1)
  @Mixin(MixinM2)
  export class MixinModel extends Model {}

  export interface MixinModel extends MixinM1, MixinM2 {}
}

const MixinModel = mongooseManager.register(
  models.MixinModel,
  {},
  models.MixinM1,
  models.MixinM2,
  models.MixinM3,
);

describe('mixin', () => {
  describe('@Default()', () => {
    it('sets default value for a model', async () => {
      const doc = await MixinModel.create({});
      doc.toObject().should.have.properties({
        foo: 'foo',
        bar: 'bar',
      });

      doc.hello().should.be.equals('world');
      MixinModel.hello2().should.be.equals('world2');
      MixinModel.hello3().should.be.equals('world3');
    });
  });
});
