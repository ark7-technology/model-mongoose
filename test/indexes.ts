import 'should';

import { A7Model, CompoundIndex, Index, Model, Unique } from '@ark7/model';

import { mongooseManager } from '../src';
import { sleep } from './util';

namespace models {
  @A7Model({})
  export class SingleFieldIndex extends Model {
    @Index()
    field1: string;

    @Unique()
    field2: string;

    @Unique({ sparse: true })
    field3?: string;
  }

  @A7Model({})
  @CompoundIndex({ field1: 1, field2: 1, field3: 1 }, { unique: true })
  export class CompoundIndexModel extends Model {
    field1: string;
    field2: string;
    field3: string;
  }

  @A7Model({})
  export class DisabledIndexModel extends Model {
    @Index({ indexDisabled: true })
    field1: SingleFieldIndex;
  }
}

const SingleFieldIndex = mongooseManager.register(models.SingleFieldIndex);
type SingleFieldIndex = models.SingleFieldIndex;

const CompoundIndexModel = mongooseManager.register(models.CompoundIndexModel);
type CompoundIndexModel = models.CompoundIndexModel;

const DisabledIndexModel = mongooseManager.register(models.DisabledIndexModel);
type DisabledIndexModel = models.DisabledIndexModel;

describe('indexes', () => {
  before(async () => {
    await SingleFieldIndex.deleteMany({});
    await CompoundIndexModel.deleteMany({});
    await sleep(1000); // Wait for indexes to be created.
  });

  describe('single field indexes', () => {
    beforeEach(async () => {
      await CompoundIndexModel.deleteMany({});
      await SingleFieldIndex.deleteMany({});
    });

    it('rejects duplicate values for unique index', async () => {
      await SingleFieldIndex.create({
        field1: 'f1',
        field2: 'foo',
        field3: 'f3_1',
      });

      await SingleFieldIndex.create({
        field1: 'f1',
        field2: 'foo',
        field3: 'f3_2',
      }).should.rejectedWith(/E11000.*/);
    });

    it('rejects duplicate values for unique sparse index', async () => {
      await SingleFieldIndex.create({
        field1: 'f1',
        field2: 'f2_1',
        field3: 'foo',
      });

      await SingleFieldIndex.create({
        field1: 'f1',
        field2: 'f2_2',
        field3: 'foo',
      }).should.rejectedWith(/E11000.*/);

      await SingleFieldIndex.create({
        field1: 'f1',
        field2: 'f2_3',
        field3: null,
      });

      await SingleFieldIndex.create({
        field1: 'f1',
        field2: 'f2_4',
        field3: null,
      }).should.rejectedWith(/E11000.*/);

      await SingleFieldIndex.create({
        field1: 'f1',
        field2: 'f2_5',
      });

      await SingleFieldIndex.create({
        field1: 'f1',
        field2: 'f2_6',
      });
    });
  });

  describe('compound indexes', () => {
    it('rejects duplicate values for unique index', async () => {
      await CompoundIndexModel.create({
        field1: 'f1',
        field2: 'f2',
        field3: 'f3',
      });

      await CompoundIndexModel.create({
        field1: 'f1',
        field2: 'f2',
        field3: 'f3',
      }).should.rejectedWith(/E11000.*/);
    });
  });

  describe('disabled indexes', () => {
    it('allows to create same value for originally unique keys', async () => {
      await DisabledIndexModel.create({
        field1: {
          field1: 'f1',
          field2: 'f2',
          field3: 'f3',
        },
      });

      await DisabledIndexModel.create({
        field1: {
          field1: 'f1',
          field2: 'f2',
          field3: 'f3',
        },
      });
    });
  });
});
