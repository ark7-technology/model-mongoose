import 'should';

import { Name, User } from './models/users';
import { mongooseManager } from '../src';

describe('mongoose-manager', () => {
  describe('.getMongooseOptions()', () => {
    it('should return expected value for User', () => {
      const mongooseOptions = mongooseManager.getMongooseOptions(User);
      mongooseOptions.should.have.properties({
        name: 'User',
      });

      mongooseOptions.schema.should.have.keys('name', 'posts');

      // console.log(mongooseOptions.schema);
    });

    it('should return expected value for Name', () => {
      const mongooseOptions = mongooseManager.getMongooseOptions(Name);
      mongooseOptions.should.have.properties({
        name: 'Name',
      });

      mongooseOptions.schema.should.have.keys('first', 'last');
      mongooseOptions.schema.should.not.have.keys('fullname');

      mongooseOptions.virtuals.should.be.deepEqual([
        {
          name: 'fullname',
          get: Object.getOwnPropertyDescriptor(Name.prototype, 'fullname').get,
        },
      ]);

      mongooseOptions.methods.should.be.deepEqual([
        {
          name: 'greeting',
          fn: Object.getOwnPropertyDescriptor(Name.prototype, 'greeting').value,
        },
      ]);

      mongooseOptions.statics.should.be.deepEqual([
        {
          name: 'createName',
          fn: Object.getOwnPropertyDescriptor(Name, 'createName').value,
        },
      ]);
    });
  });
});
