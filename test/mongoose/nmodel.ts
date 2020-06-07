import * as _ from 'underscore';
import * as db from '../../src/mongoose';
import * as should from 'should';
import * as mongoose from 'mongoose';

enum UserDataLevel {
  BASIC = 'BASIC',
  DETAILS = 'DETAILS',
}

class Name extends db.Model {
    @db.Field({
      default: 'A_FIRSTNAME',
    })
    first: string;
    @db.Field({
      default: 'A_LASTNAME',
    })
    last: string;
}
export enum UserType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface Address {
  city: string;
}
@db.Config({
  collection: 'sbase.tests.users',
  discriminatorKey: 'kind',
  dataLevel: {
    levels: UserDataLevel,
  },
})
class UserModel extends db.A7Model {
  @db.Field({
    level: UserDataLevel.BASIC,
  })
  name: Name;

  @db.Field({
    level: UserDataLevel.DETAILS,
  })
  bio: string;

  @db.Field({
    type: [Name],
  })
  children: Name[];

  @db.Enum(UserType)
  type: UserType;

  @db.Field()
  address: Address;

  @db.Field({
    type: Map,
    of: String,
    default: {},
    level: UserDataLevel.DETAILS,
  })
  maps: Map<string, string>;

  get fullname() {
    return  this.name.first + ' ' + this.name.last;
  }
}

@db.Config({
  collection: 'sbase.tests.posts',
})
class PostModel extends db.A7Model {
  @db.DBRef('User')
  user: mongoose.Types.ObjectId;

  @db.Required()
  text: string;
}

const User = UserModel.$register();
type User = UserModel;

const Post = PostModel.$register();
type Post = PostModel;

describe('NModel Basics', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should generate default value', async () => {
    const user = await User.create({});
    user.name.first.should.be.equal('A_FIRSTNAME');
    user.name.last.should.be.equal('A_LASTNAME');
  });

  it('should return only one level data', async () => {
    const user = await User.create({
      name: {
        first: 'foo',
        last: 'bar',
      },
      bio: 'tie',
    });
    user.name.first.should.be.equal('foo');
    user.name.last.should.be.equal('bar');
    user.bio.should.be.equal('tie');

    const user1 = await User.findById(
      user._id,
      {},
      { level: UserDataLevel.BASIC },
    );
    user1.name.first.should.be.equal('foo');
    user1.name.last.should.be.equal('bar');
    should(user1.bio).not.be.ok();
  });

  it('should set getter correct', async () => {
    const user = await User.create({
      name: {
        first: 'foo',
        last: 'bar',
      },
      bio: 'tie',
    });
    user.fullname.should.be.equal('foo bar');
  });

  it('should save post with model instance', async () => {
    const user = await User.create({
      name: {
        first: 'foo',
        last: 'bar',
      },
      bio: 'tie',
    });

    const post = await Post.findOneAndUpdate(
      {
        user: user._id,
      },
      {
        user: user._id,
        post: 'Text',
      },
      {
        upsert: true,
        new: true,
      },
    );
    post.user.should.be.ok();
  });

  it('should modelize object', async () => {
    const u = Name.modelize({ first: 'a' });
    u.should.be.instanceof(Name);
    u.toJSON().should.have.properties({ first: 'a' });
  });
});