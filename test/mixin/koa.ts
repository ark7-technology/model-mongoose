import 'should';

import _ from 'underscore';
import { A7Model, Basic, DefaultDataLevel, Model, Short } from '@ark7/model';

import { mongooseManager } from '../../src';

namespace models {
  @A7Model({})
  export class KOA extends Model {
    @Basic() foo: string;

    @Short() foo2?: string;
  }
}

const KOA = mongooseManager.register(models.KOA);
type KOA = models.KOA;

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

  describe('#getMiddleware', () => {
    let d: KOA;

    beforeEach(async () => {
      d = await KOA.create({ foo: 'bar', foo2: 'bar2' });
    });

    it('should reads data successfully', async () => {
      const m = KOA.getMiddleware({ field: 'id' });
      const ctx: any = {
        request: {},
        params: {
          id: d._id.toString(),
        },
      };
      await m(ctx, null);
      ctx.body
        .toJSON()
        .should.be.deepEqual({ _id: d._id, foo: 'bar', foo2: 'bar2' });
    });

    // it('should returns basic data', async () => {
    // const m = KOA.getMiddleware({
    // field: 'id',
    // level: DefaultDataLevel.BASIC,
    // });
    // const ctx: any = {
    // request: {},
    // params: {
    // id: d._id.toString(),
    // },
    // };
    // await m(ctx, null);
    // ctx.body.toJSON().should.be.deepEqual({ _id: d._id, foo: 'bar' });
    // });
  });
});
