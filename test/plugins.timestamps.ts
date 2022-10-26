import 'should';

import { A7Model, Model as _Model } from '@ark7/model';

import {
  MongooseModel,
  MongoosePluginPeriod,
  hasModelName,
  mongooseManager,
} from '../src';
import {
  createdAtPlugin,
  lastUpdateTimePlugin,
} from '../src/plugins/timestamps';

mongooseManager.plugin(MongoosePluginPeriod.BEFORE_REGISTER, {
  suitable: hasModelName('TestTimestampPluginModel'),
  fn: createdAtPlugin(),
});
mongooseManager.plugin(MongoosePluginPeriod.BEFORE_REGISTER, {
  suitable: hasModelName('TestTimestampPluginModel'),
  fn: lastUpdateTimePlugin(),
});

describe('plugin', () => {
  describe('timestamp', () => {
    @A7Model({})
    class TestTimestampPluginModel extends MongooseModel {
      val: string;
      createdAt?: Date;
      lastUpdateTime?: Date;
    }

    const Model = mongooseManager.register(TestTimestampPluginModel);
    type Model = TestTimestampPluginModel;

    it('should auto generate createdAt and lastUpdateTime value', async () => {
      const ins = await Model.create({ val: '1' });
      ins.createdAt.should.be.not.be.null();
      ins.lastUpdateTime.should.be.not.be.null();

      const ins2: Model = await Model.findById(ins._id);
      ins2.val = '2';
      await ins2.save();

      ins.createdAt.getTime().should.be.equal(ins2.createdAt.getTime());
      ins.lastUpdateTime
        .getTime()
        .should.not.be.equal(ins2.lastUpdateTime.getTime());

      // find old item without createdAt in projection and then save, should not changed the createdAt field
      for await (const item of Model.find(
        { _id: ins._id },
        { val: 1 },
        {},
      ).cursor()) {
        await item.save();

        const ins2: Model = await Model.findById(ins._id);
        ins2.createdAt.getTime().should.be.equal(ins.createdAt.getTime());
      }
    });
  });
});
