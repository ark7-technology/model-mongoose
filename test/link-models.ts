import * as should from 'should';
import {
  A7Model,
  Basic,
  BasicToBasic,
  DefaultDataLevel,
  Detail,
  Model,
  Ref,
} from '@ark7/model';
import { Mongoose } from 'mongoose';

import { MongooseManager, mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class LinkSource extends Model {
    value: string;
  }

  @A7Model({})
  export class LinkTarget extends Model {
    source: Ref<LinkSource>;
  }

  @A7Model({})
  export class LinkAutoPopSource extends Model {
    @Basic() name: string;
    @Detail() secret: string;
  }

  @A7Model({})
  export class LinkAutoPopTarget extends Model {
    @BasicToBasic()
    ref: Ref<LinkAutoPopSource>;

    @Basic() label: string;
  }
}

describe('linkModels', () => {
  describe('single-tenant', () => {
    let sourceManager: MongooseManager;
    let targetManager: MongooseManager;
    let LinkSource: any;
    let LinkTarget: any;

    before(async () => {
      const sourceMongoose = new Mongoose();
      await sourceMongoose.connect(
        'mongodb://localhost:27017/model-mongoose-test',
      );

      const targetMongoose = new Mongoose();
      await targetMongoose.connect(
        'mongodb://localhost:27017/model-mongoose-test',
      );

      sourceManager = new MongooseManager(sourceMongoose);
      targetManager = new MongooseManager(targetMongoose);

      LinkSource = sourceManager.register(models.LinkSource);
      LinkTarget = targetManager.register(models.LinkTarget);

      // Force-resolve lazy proxies before linkModels so that the target
      // connection already has LinkTarget registered. Otherwise the
      // static MongooseManager.models map contains unresolved proxies
      // that cause infinite recursion when Mongoose.model() finds them
      // in connection.models during lazy registration.
      await LinkSource.deleteMany({});
      await LinkTarget.deleteMany({});

      targetManager.linkModels(sourceManager);
    });

    it('should copy source models into target connection', () => {
      const conn = (targetManager as any).mongoose.connection;
      should(conn.models['LinkSource']).be.ok();
      should(conn.models['LinkSource']).equal(LinkSource);
    });

    it('should not overwrite existing models', () => {
      const conn = (targetManager as any).mongoose.connection;
      const originalModel = conn.models['LinkTarget'];

      targetManager.linkModels(sourceManager);

      (conn.models['LinkTarget'] === originalModel).should.be.true();
    });

    it('should allow populate() to resolve cross-connection refs', async () => {
      const src = await LinkSource.create({ value: 'hello' });
      const tgt = await LinkTarget.create({ source: src._id });

      const populated = await LinkTarget.findById(tgt._id).populate('source');
      populated.source.value.should.equal('hello');
    });
  });

  describe('auto-populate with data level', () => {
    let LinkAutoPopSource: any;
    let LinkAutoPopTarget: any;

    before(() => {
      LinkAutoPopSource = mongooseManager.register(models.LinkAutoPopSource);
      LinkAutoPopTarget = mongooseManager.register(models.LinkAutoPopTarget);
    });

    before(async () => {
      await LinkAutoPopSource.deleteMany({});
      await LinkAutoPopTarget.deleteMany({});
    });

    it('should auto-populate refs when querying with data level', async () => {
      const src = await LinkAutoPopSource.create({
        name: 'auto',
        secret: 'hidden',
      });
      const tgt = await LinkAutoPopTarget.create({
        ref: src._id,
        label: 'level-test',
      });

      const found = await LinkAutoPopTarget.findOne(
        { _id: tgt._id },
        {},
        { level: DefaultDataLevel.BASIC },
      );

      found.label.should.equal('level-test');
      // ref should be auto-populated (object, not ObjectId)
      found.ref.name.should.equal('auto');
    });

    it('should only project fields at the requested level', async () => {
      const src = await LinkAutoPopSource.create({
        name: 'visible',
        secret: 'confidential',
      });
      const tgt = await LinkAutoPopTarget.create({
        ref: src._id,
        label: 'projection-test',
      });

      const found = await LinkAutoPopTarget.findOne(
        { _id: tgt._id },
        {},
        { level: DefaultDataLevel.BASIC },
      );

      // At BASIC level, the populated ref should only have BASIC fields
      found.ref.name.should.equal('visible');
      should(found.ref.secret).be.undefined();
    });
  });
});
