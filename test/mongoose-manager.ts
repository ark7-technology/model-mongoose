import 'should';

import { Name, Post, User } from './models/users';
import { mongooseManager } from '../src';

describe('mongoose-manager', () => {
  describe('.getMongooseOptions()', () => {
    it('should return expected value for User', () => {
      const mongooseOptions = mongooseManager.getMongooseOptions(User);
      mongooseOptions.should.have.properties({
        name: 'User',
      });

      mongooseOptions.schema.should.have.keys('name', 'posts');

      mongooseOptions.schema.posts.should.be.deepEqual({
        required: true,
        type: [
          {
            ref: 'Post',
            type: 'ObjectId',
          },
        ],
        default: [],
      });

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

      // console.log(mongooseOptions.schema);
    });

    it('should return expected value for Post', () => {
      const mongooseOptions = mongooseManager.getMongooseOptions(Post);
      mongooseOptions.should.have.properties({
        name: 'Post',
      });

      mongooseOptions.schema.should.have.keys('topic', 'author');

      mongooseOptions.schema.should.be.deepEqual({
        author: {
          required: true,
          ref: 'User',
          type: 'ObjectId',
        },
        topic: {
          required: true,
          type: String,
        },
      });

      // console.log(mongooseOptions.schema);
    });
  });
});
