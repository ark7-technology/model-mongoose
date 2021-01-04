import 'should';

import { db } from './db';

describe('db', () => {
  it('should save and read data', async () => {
    const x = await db.User.create({
      name: {
        first: 'fff',
        last: 'wang',
      } as any,
      posts: [],
    });

    x.name.fullname.should.be.equals('fff wang');

    const y = await db.User.findById(x._id);

    y.name.fullname.should.be.equals('fff wang');
  });

  it('should trigger validation', async () => {
    await db.User.create({
      name: {
        first: 'ffffff',
        last: 'wang',
      } as any,
      posts: [],
    }).should.be.rejectedWith(
      'User validation failed: name.first: Path `first` (`ffffff`) is longer than the maximum allowed length (5)., name: Validation failed: first: Path `first` (`ffffff`) is longer than the maximum allowed length (5).',
    );
  });

  it('should save posts data', async () => {
    // const user = await db.User.create({
    // name: {
    // first: 'fff',
    // last: 'wang',
    // },
    // posts: [],
    // });
  });
});
