import 'should';

import {
  A7Model,
  Autogen,
  Basic,
  DefaultDataLevel,
  Detail,
  Readonly,
  Ref,
  Short,
} from '@ark7/model';

namespace models {
  @A7Model({})
  export class ExtendM1 {
    readonly f1: string;
    @Autogen()
    @Short()
    a1: string;
  }

  @A7Model({})
  export class ExtendM2 {
    m1: ExtendM1;

    @Readonly()
    @Basic()
    f2: string;

    @Short({ [DefaultDataLevel.SHORT]: DefaultDataLevel.BASIC })
    m3: ExtendM1[];

    @Detail()
    m4: Ref<ExtendM1>;
  }
}

describe('mixin.extend', () => {
  describe('CombinedModelField', () => {
    it('should return correct readonly fields', () => {
      const metadata = A7Model.getMetadata(models.ExtendM2);
      metadata
        .readonlyFields()
        .should.be.deepEqual(['m1.f1', 'm1.a1', 'f2', 'm3.f1', 'm3.a1']);
    });

    it('should return correct autogen fields', () => {
      const metadata = A7Model.getMetadata(models.ExtendM2);
      metadata.autogenFields().should.be.deepEqual(['m1.a1', 'm3.a1']);
    });

    it('should return basic data level populates', () => {
      const metadata = A7Model.getMetadata(models.ExtendM2);
      metadata.dataLevelPopulates(DefaultDataLevel.BASIC).should.be.deepEqual({
        populates: [],
        projections: ['_id', 'm1._id', 'm1.f1', 'f2'],
      });

      metadata.dataLevelPopulates(DefaultDataLevel.SHORT).should.be.deepEqual({
        populates: [],
        projections: [
          '_id',
          'm1._id',
          'm1.f1',
          'm1.a1',
          'f2',
          'm3._id',
          'm3.f1',
        ],
      });

      metadata.dataLevelPopulates(DefaultDataLevel.DETAIL).should.be.deepEqual({
        populates: [
          { path: 'm4', select: { _id: 1, a1: 1, f1: 1 }, populate: [] },
        ],
        projections: [
          '_id',
          'm1._id',
          'm1.f1',
          'm1.a1',
          'f2',
          'm3._id',
          'm3.f1',
          'm3.a1',
          'm4',
        ],
      });
    });
  });
});
