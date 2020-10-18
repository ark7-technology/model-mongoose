import 'should';

import { A7Model } from '@ark7/model';

import { hasField, hasModelName } from '../src/plugin';
import { mongooseManager } from '../src';

describe('plugin', () => {
  @A7Model({})
  class TestPluginModel {
    createdAt?: Date;
    lastUpdateTime?: Date;
  }

  describe('.hasField()', () => {
    it('should return true for an existing field', () => {
      const o = mongooseManager.getMongooseOptions(TestPluginModel);

      hasField('createdAt')(o).should.be.true();
      hasField('lastUpdateTime')(o).should.be.true();
    });

    it('should return false for a non-existing field', () => {
      const o = mongooseManager.getMongooseOptions(TestPluginModel);

      hasField('non-existing')(o).should.be.false();
    });
  });

  describe('.hasModelName()', () => {
    it('should return true for matching models', () => {
      const o = mongooseManager.getMongooseOptions(TestPluginModel);

      hasModelName('TestPluginModel')(o).should.be.true();
      hasModelName(['TestPluginModel'])(o).should.be.true();
    });

    it('should return false for matching models', () => {
      const o = mongooseManager.getMongooseOptions(TestPluginModel);

      hasModelName('TestPluginModel2')(o).should.be.false();
    });
  });

  describe('multiple suitable checks', () => {
    it('should return true for both model name and field', () => {
      const o = mongooseManager.getMongooseOptions(TestPluginModel);

      hasField('createdAt')
        .and(hasModelName('TestPluginModel'))(o)
        .should.be.true();
    });

    it('should return false for any model name or field not matching', () => {
      const o = mongooseManager.getMongooseOptions(TestPluginModel);

      hasField('createdAt')
        .and(hasModelName('TestPluginModel2'))(o)
        .should.be.false();

      hasField('createdAt2')
        .and(hasModelName('TestPluginModel'))(o)
        .should.be.false();

      hasField('createdAt2')
        .and(hasModelName('TestPluginModel2'))(o)
        .should.be.false();
    });
  });
});
