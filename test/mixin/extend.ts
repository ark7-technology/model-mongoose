import 'should';

import { A7Model, Autogen, Readonly, Ref } from '@ark7/model';

namespace models {
  @A7Model({})
  export class ExtendM1 {
    readonly f1: string;
    @Autogen() a1: string;
  }

  @A7Model({})
  export class ExtendM2 {
    m1: ExtendM1;

    @Readonly() f2: string;

    m3: ExtendM1[];

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
  });
});
