import 'should';

import _ from 'underscore';
import {
  A7Model,
  Basic,
  Confidential,
  Default,
  DefaultDataLevel,
  Detail,
  Model,
  Readonly,
  Ref,
  Short,
} from '@ark7/model';

import { mongooseManager } from '../../src';

namespace models {
  @A7Model({})
  export class KOA1 extends Model {
    @Basic() foo: string;
    @Short()
    @Default('bar')
    foo2?: string;
  }

  @A7Model({})
  export class KOA extends Model {
    @Basic() foo: string;

    @Short()
    @Readonly()
    foo2?: string;

    @Default(1)
    @Confidential()
    s3?: number;

    @Detail() e1?: KOA1;

    @Short() e2?: Ref<KOA1>;

    @Short() e3?: Ref<KOA1>[];
  }
}

const KOA = mongooseManager.register(models.KOA);
type KOA = models.KOA;
const KOA1 = mongooseManager.register(models.KOA1);
type KOA1 = models.KOA1;

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
      _.omit(ctx.body, '_id').should.be.deepEqual({
        foo: 'bar',
        e3: [],
      });
    });
  });

  describe('#getMiddleware', () => {
    let e: KOA1;
    let d: KOA;

    beforeEach(async () => {
      e = await KOA1.create({ foo: 'bar' });
      d = await KOA.create({ foo: 'bar', foo2: 'bar2', e1: e, e2: e, e3: [e] });
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
      ctx.body.should.be.deepEqual({
        _id: d._id.toString(),
        foo: 'bar',
        foo2: 'bar2',
        e2: e.toJSON(),
        e1: e.toJSON(),
        e3: [e.toJSON()],
      });
    });

    it('should returns basic data', async () => {
      const m = KOA.getMiddleware({
        field: 'id',
        level: DefaultDataLevel.BASIC,
      });
      const ctx: any = {
        request: {},
        params: {
          id: d._id.toString(),
        },
      };
      await m(ctx, null);
      ctx.body.should.be.deepEqual({ _id: d._id.toString(), foo: 'bar' });
    });
  });

  describe('#findMiddleware', () => {
    let e: KOA1;
    let d1: KOA;
    let d2: KOA;

    beforeEach(async () => {
      await KOA.deleteMany({});
      e = await KOA1.create({ foo: 'bar' });
      d1 = await KOA.create({
        foo: 'bar',
        foo2: 'bar2',
        e1: e,
        e2: e,
        e3: [e],
        s3: 6,
      });
      d2 = await KOA.create({
        foo: 'bar',
        foo2: 'bar2',
        e1: e,
        e2: e,
        e3: [e],
        s3: 4,
      });
    });

    it('should find data successfully', async () => {
      const m = KOA.findMiddleware({});
      const ctx: any = {
        request: {},
        params: {},
      };
      await m(ctx, null);
      ctx.body.should.be.deepEqual([
        d1.toJSON({ level: DefaultDataLevel.SHORT }),
        d2.toJSON({ level: DefaultDataLevel.SHORT }),
      ]);
    });

    it('should find pagination data successfully', async () => {
      const m = KOA.findMiddleware({
        pagination: {
          agg: {
            s3: ['sum', 's3'],
          },
          size: 1,
        },
      });
      const ctx: any = {
        request: {},
        params: {},
      };
      await m(ctx, null);
      ctx.body.should.be.deepEqual({
        pageSize: 1,
        page: 0,
        total: 2,
        data: [d1.toJSON({ level: DefaultDataLevel.SHORT })],
        agg: {
          s3: 4,
        },
      });
    });
  });

  describe('#updateMiddleware', () => {
    let e: KOA1;
    let d: KOA;

    beforeEach(async () => {
      e = await KOA1.create({ foo: 'bar' });
      d = await KOA.create({ foo: 'bar', foo2: 'bar2', e1: e, e2: e, e3: [e] });
    });

    it('should not update readonly data', async () => {
      const m = KOA.updateMiddleware({ field: 'id' });
      const ctx: any = {
        request: {
          body: {
            foo2: 'bar3',
            'e1.foo': 'bar2',
          },
        },
        params: {
          id: d._id.toString(),
        },
      };
      await m(ctx, null);
      ctx.body.should.be.deepEqual({
        _id: d._id.toString(),
        foo: 'bar',
        foo2: 'bar2',
        e2: e.toJSON(),
        e1: _.extend(e.toJSON(), { foo: 'bar2' }),
        e3: [e.toJSON()],
      });
    });
  });
});
