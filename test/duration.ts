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

    isDuration(d.d1).should.be.true();
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
