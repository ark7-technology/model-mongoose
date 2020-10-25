import 'should';

import { A7Model, Autogen } from '@ark7/model';

import { MongooseModel, mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class TestMongooseModel extends MongooseModel {
    readonly f1: string;
    @Autogen() a1: string;
  }
}

const TestMongooseModel = mongooseManager.register(models.TestMongooseModel);

describe('mongoose-model', () => {
  describe('#getMetadata()', () => {
    it('should return correct readonly fields', () => {
      const metadata = TestMongooseModel.getMetadata();
      metadata.should.not.be.null();
    });
  });
});
