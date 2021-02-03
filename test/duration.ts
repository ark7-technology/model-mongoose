import 'should';
import '@ark7/model/extensions/moment';

import { A7Model, Model } from '@ark7/model';
import { Duration, isDuration } from 'moment';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class DurationModel extends Model {
    d1: Duration;
  }
}

const DurationModel = mongooseManager.register(models.DurationModel);

describe('duration', () => {
  beforeEach(async () => {
    await DurationModel.deleteMany({});
  });

  it('modelizes duration data', async () => {
    const d = models.DurationModel.modelize({
      d1: 'P2Y',
    });

    isDuration(d.d1).should.be.true();
  });

  it('saves correct data', async () => {
    const d = await DurationModel.create({
      d1: 'P2Y',
    });

    d.d1.toString().should.be.equal('P2Y');

    d.d1 = 'P3Y' as any;
    await d.save();

    await DurationModel.updateOne({ _id: d._id }, {
      d1: 'P2Y',
    } as any);
  });

  it('convert to JSON', async () => {
    const d = await DurationModel.create({
      d1: 'P2Y',
    });

    d.toJSON().should.have.properties({
      d1: 'P2Y',
    });
  });
});
