import 'should';
import '@ark7/model/extensions/moment';

import { A7Model, Model } from '@ark7/model';
import { Moment, isMoment } from 'moment';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class MomentModel extends Model {
    d1: Moment;
  }
}

const MomentModel = mongooseManager.register(models.MomentModel);

describe('duration', () => {
  it('modelizes duration data', async () => {
    const d = models.MomentModel.modelize({
      d1: new Date().toISOString(),
    });

    isMoment(d.d1).should.be.true();
  });

  it('saves correct data', async () => {
    const d = await MomentModel.create({
      d1: new Date().toISOString(),
    });

    isMoment(d.d1).should.be.true();
  });

  it('convert to JSON', async () => {
    const str = new Date().toISOString();
    const d = await MomentModel.create({
      d1: str,
    });

    d.toJSON().should.have.properties({
      d1: new Date(str).toString(),
    });
  });
});
