import 'should';

import _ from 'underscore';
import { A7Model, Model } from '@ark7/model';

import { mongooseManager } from '../../src';

namespace models {
  @A7Model({})
  export class KOA extends Model {
    foo: string;
  }
}

const KOA = mongooseManager.register(models.KOA);

describe('koa', () => {
  describe('#createMiddleware', () => {
    it('should be rejected with missing parameters', async () => {
      const m = KOA.createMiddleware({});

      const ctx: any = {
        request: {
          body: {},
        },
      };
      await m(ctx, null).should.rejectedWith(
        'KOA validation failed: foo: Path `foo` is required.',
      );
    });

    it('should create object successfully', async () => {
      const m = KOA.createMiddleware({});

      const ctx: any = {
        request: {
          body: {
            foo: 'bar',
          },
        },
      };
      await m(ctx, null);
      _.omit(ctx.body.toJSON(), '_id').should.be.deepEqual({ foo: 'bar' });
    });
  });
});
