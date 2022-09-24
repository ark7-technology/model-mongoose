import { overrides } from '../../src';

describe('koa.overrides', () => {
  describe('overrides', () => {
    it('should overrides array', () => {
      const ctx: any = {
        request: {},
        params: {},
      };
      overrides(['constValue', 'query.$or.[0].status'])(ctx, async () => {});

      ctx.overrides.query.should.be.deepEqual({
        $or: [{ status: 'constValue' }],
      });

      overrides(['constValue2', 'query.$or.[1].status'])(ctx, async () => {});

      ctx.overrides.query.should.be.deepEqual({
        $or: [{ status: 'constValue' }, { status: 'constValue2' }],
      });
    });
  });
});
