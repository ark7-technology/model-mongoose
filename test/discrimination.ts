import 'should';

import { A7Model } from '@ark7/model';

import { DiscriminateMongooseModel, mongooseManager } from '../src';

namespace models {
  @A7Model({
    discriminatorKey: 'kind',
  })
  export class DiscriminationModel1 extends DiscriminateMongooseModel {
    kind?: string;
  }

  @A7Model({})
  export class DiscriminationModel2 extends DiscriminationModel1 {
    foo: string;
  }

  @A7Model({})
  export class DiscriminationModel3 extends DiscriminationModel1 {
    bar: string;
  }
}

const DiscriminationModel1 = mongooseManager.register(
  models.DiscriminationModel1,
);
type DiscriminationModel1 = mongooseManager.registerModel<
  models.DiscriminationModel1
>;

const DiscriminationModel2 = DiscriminationModel1.$discriminator(
  models.DiscriminationModel2,
);
type DiscriminationModel2 = mongooseManager.registerModel<
  models.DiscriminationModel2
>;

const DiscriminationModel3 = DiscriminationModel1.$discriminator(
  models.DiscriminationModel3,
);
type DiscriminationModel3 = mongooseManager.registerModel<
  models.DiscriminationModel3
>;

describe('discriminator', () => {
  it('should allows discriminator creation', async () => {
    const m2 = await DiscriminationModel2.create({
      foo: 'foo',
    });

    m2.kind.should.be.equals('DiscriminationModel2');
  });
});
