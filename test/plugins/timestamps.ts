import 'should';

import { A7Model } from '@ark7/model';

import { mongooseManager } from '../../src';

describe('plugin', () => {
  describe('.hasField()', () => {
    @A7Model({})
    class TestTimestampPluginModel {
      createdAt?: Date;
      lastUpdateTime?: Date;
    }

    // it('should return true for an existing field', () => {
    // const o = mongooseManager.getMongooseOptions(TestTimestampPluginModel);

    // hasField('createdAt')(o).should.be.true();
    // hasField('lastUpdateTime')(o).should.be.true();
    // });

    // it('should return false for a non-existing field', () => {
    // const o = mongooseManager.getMongooseOptions(TestTimestampPluginModel);

    // hasField('non-existing')(o).should.be.false();
    // });
  });
});
