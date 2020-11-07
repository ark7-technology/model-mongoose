import 'should';

import { A7Model, Mixin, Model } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class TestTypesModel1 extends Model {
    foo: string;

    static f1() {}
  }

  @A7Model({})
  @Mixin(TestTypesModel1)
  export class TestTypesModel2 extends Model {
    bar: string;

    static f2() {}
  }
}

const TestTypesModel2 = mongooseManager.register(
  models.TestTypesModel2,
  {},
  models.TestTypesModel1,
);
type TestTypesModel2 = mongooseManager.registerModel<
  models.TestTypesModel2,
  models.TestTypesModel1
>;

describe('types', () => {
  it('should has sufficient types', async () => {
    TestTypesModel2.f2.should.be.a.Function();
    TestTypesModel2.f1.should.be.a.Function();

    const ins: TestTypesModel2 = await TestTypesModel2.create({
      foo: 'foo',
      bar: 'bar',
    });

    ins.foo.should.be.equal('foo');
    ins.bar.should.be.equal('bar');
  });
});
