import 'should';

import * as mongoose from 'mongoose';
import { A7Model, ID, Model } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class IDModel extends Model {
    fooID?: ID;
  }
}

export const IDModel = mongooseManager.register(models.IDModel);

describe('ID', () => {
  it('returns abstract fields', async () => {
    const metadata = A7Model.getMetadata('ID');
    metadata.should.have.properties({
      configs: {
        schema: {},
      },
    });
  });

  it('failed the enum check', async () => {
    mongooseManager
      .getMongooseOptions(models.IDModel)
      .schema.fooID.should.be.deepEqual({
        required: false,
        type: mongoose.SchemaTypes.ObjectId,
      });
  });
});
