import 'should';

import * as _ from 'underscore';
import {
  A7Model,
  Basic,
  BasicToBasic,
  DefaultDataLevel,
  Detail,
  Mixin,
  Ref,
  StrictModel,
} from '@ark7/model';

import { MongooseModel, mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class TestDataLevel1 extends StrictModel {
    default1: string;
    @Basic() basic1: string;
    @Detail() detail1: string;

    get g1() {
      return 'g1';
    }

    @Basic()
    get g2() {
      return 'g2';
    }
  }

  @A7Model({})
  export class TestDataLevel2 extends StrictModel {
    default2: string;
    @Basic() basic2: string;
    @Detail() detail2: string;
  }

  @A7Model({})
  @Mixin(TestDataLevel2)
  export class TestDataLevel3 extends MongooseModel {
    default3: string;
    @Basic() basic3: string;
    @Detail() detail3: string;

    @Basic() f1: TestDataLevel1;

    @BasicToBasic()
    l4: Ref<TestDataLevel4>;

    get g1() {
      return 'g1';
    }

    @Basic()
    get g2() {
      return 'g2';
    }
  }

  @A7Model({})
  export class TestDataLevel4 extends MongooseModel {
    get foo() {
      return 'bar';
    }

    @Detail() detail1: string;
  }

  export interface TestDataLevel3 extends TestDataLevel2 {}
}

const TestDataLevel3 = mongooseManager.register(models.TestDataLevel3);
const TestDataLevel4 = mongooseManager.register(models.TestDataLevel4);

describe('data-level', () => {
  it('should returns proper data', async () => {
    const foreign = await TestDataLevel4.create({
      detail1: 'detail1',
    });

    const ins = await TestDataLevel3.create({
      default2: 'default2',
      default3: 'default3',
      basic2: 'basic2',
      basic3: 'basic3',
      detail2: 'detail2',
      detail3: 'detail3',
      f1: {
        default1: 'default1',
        basic1: 'basic1',
        detail1: 'detail1',
      },
      l4: foreign,
    });

    _.omit(
      ins.toJSON({ level: DefaultDataLevel.BASIC }),
      '_id',
      'l4',
    ).should.be.deepEqual({
      default3: 'default3',
      basic3: 'basic3',
      f1: { default1: 'default1', basic1: 'basic1', g2: 'g2' },
      default2: 'default2',
      basic2: 'basic2',
      g2: 'g2',
    });

    const ins2 = await TestDataLevel3.findOne(
      { _id: ins._id },
      { __v: 1 },
      { level: DefaultDataLevel.BASIC },
    );

    _.omit(ins2.toJSON(), '_id').should.be.deepEqual({
      default3: 'default3',
      basic3: 'basic3',
      f1: { default1: 'default1', basic1: 'basic1' },
      default2: 'default2',
      basic2: 'basic2',
      l4: foreign.toJSON({ level: DefaultDataLevel.BASIC }),
    });
  });
});
