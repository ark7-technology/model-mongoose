import 'should';

import { A7Model, StrictModel } from '@ark7/model';

import {
  DiscriminateMongooseModel,
  MongooseModel,
  mongooseManager,
} from '../src';

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

  @A7Model({
    discriminatorKey: 'kind',
  })
  export class DiscriminationSubModel1 extends StrictModel {
    kind?: string;
    nn: string;
  }

  @A7Model({})
  export class DiscriminationSubModel2 extends DiscriminationSubModel1 {
    name: string;
  }

  @A7Model({})
  export class DiscriminationSubModel extends MongooseModel {
    sub: DiscriminationSubModel1;
    sub2: DiscriminationSubModel1[];
  }
}

const DiscriminationModel1 = mongooseManager.register(
  models.DiscriminationModel1,
);
type DiscriminationModel1 =
  mongooseManager.registerModel<models.DiscriminationModel1>;

const DiscriminationModel2 = DiscriminationModel1.$discriminator(
  models.DiscriminationModel2,
);
type DiscriminationModel2 =
  mongooseManager.registerModel<models.DiscriminationModel2>;

const DiscriminationModel3 = DiscriminationModel1.$discriminator(
  models.DiscriminationModel3,
);
type DiscriminationModel3 =
  mongooseManager.registerModel<models.DiscriminationModel3>;

const DiscriminationSubModel = mongooseManager.register(
  models.DiscriminationSubModel,
);
type DiscriminationSubModel = models.DiscriminationSubModel;

describe('discriminator', () => {
  it('should allows discriminator creation', async () => {
    const m2 = await DiscriminationModel2.create({
      foo: 'foo',
    });

    m2.kind.should.be.equals('DiscriminationModel2');
  });

  it('should allows nested discriminator', async () => {
    const m1 = await DiscriminationSubModel.create({
      sub: {
        kind: 'DiscriminationSubModel2',
        name: 'hello',
        nn: 'yes',
      },
      sub2: [
        {
          kind: 'DiscriminationSubModel2',
          name: 'hello',
          nn: 'yes',
        },
      ],
    } as any);

    m1.sub.kind.should.be.equals('DiscriminationSubModel2');
    m1.sub2[0].kind.should.be.equals('DiscriminationSubModel2');
  });
});
