import 'should';

import { A7Model } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  export enum EnumValue {
    HELLO = 'HELLO',
  }

  A7Model.provide(EnumValue);

  @A7Model({})
  export class EnumModel {
    foo: EnumValue;
  }
}

const EnumModel = mongooseManager.register(models.EnumModel);

describe('enums', () => {
  it('returns abstract fields', async () => {
    const metadata = A7Model.getMetadata('EnumModel');
    metadata.should.have.properties({
      configs: {
        schema: {
          name: 'EnumModel',
          props: [
            {
              name: 'foo',
              optional: false,
              modifier: 'PUBLIC',
              type: {
                referenceName: 'EnumValue',
              },
            },
          ],
        },
      },
    });
  });

  it('failed the enum check', async () => {
    await EnumModel.create({ foo: 'HELLO' } as any);
    await EnumModel.create({ foo: 'HELLO2' } as any).should.rejectedWith(
      'EnumModel validation failed: foo: `HELLO2` is not a valid enum value for path `foo`.',
    );
  });
});
