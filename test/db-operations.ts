import 'should';

import { db } from './models/db';

describe('db', () => {
  it('should save and read data', async () => {
    const x = await db.User.create({
      name: {
        first: 'fff',
        last: 'wang',
      },
      posts: [],
    });

    x.name.fullname.should.be.equals('fff wang');

    const y = await db.User.findById(x._id);

    y.name.fullname.should.be.equals('fff wang');
  });

  it('should trigger validation', async () => {
    await db.User.create({
      name: {
        first: 'ff',
        last: 'wang',
      },
      posts: [],
    }).should.be.rejectedWith(
      'User validation failed: name.first: first must with at least 3 chars, value: ff, name: Validation failed: first: first must with at least 3 chars, value: ff',
    );
  });
});
