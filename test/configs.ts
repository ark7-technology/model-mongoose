import 'should';

import { A7Model, Model } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class ConfigsModel extends Model {
    field1: string;
  }
}

const ConfigsModel = mongooseManager.register(models.ConfigsModel, {
  collection: 'configs.models',
});
type ConfigsModel = models.ConfigsModel;

describe('configs', () => {
  it('should be able to set the collection names', () => {
    ConfigsModel.collection.name.should.be.equal('configs.models');
  });
});
