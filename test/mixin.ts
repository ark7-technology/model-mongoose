import 'should';

import { A7Model, Default, Mixin, Model, StrictModel } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class MixinM1 extends StrictModel {
    @Default('foo') foo?: string;

    hello() {
      return 'world1';
    }

    static bar() {
      return 'bar1';
    }
  }

  @A7Model({})
  export class MixinM3 extends StrictModel {
    hello() {
      return 'world3';
    }

    static hello3() {
      return 'world3';
    }

    static bar() {
      return 'bar3';
    }
  }

  @A7Model({})
  @Mixin(MixinM3)
  export class MixinM2 extends StrictModel {
    @Default('bar') bar?: string;

    static hello2() {
      return 'world2';
    }

    static bar() {
      return 'bar2';
    }
  }

  @A7Model({})
  @Mixin(MixinM1)
  @Mixin(MixinM2)
  export class MixinModel extends Model {
    hello() {
      return 'world';
    }

    static bar() {
      return 'bar';
    }
  }

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

      doc.hello().should.be.equals('world1');
      MixinModel.bar().should.be.equals('bar1');
      MixinModel.hello2().should.be.equals('world2');
      MixinModel.hello3().should.be.equals('world3');
    });
  });
});
