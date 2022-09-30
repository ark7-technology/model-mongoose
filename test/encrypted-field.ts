import 'should';

import * as _ from 'underscore';
import * as mongoose from 'mongoose';
import {
  A7Model,
  EncryptAlgorithm,
  Encrypted,
  Mixin,
  SSN,
  StrictModel,
} from '@ark7/model';

import { MongooseModel, mongooseManager } from '../src';
import { ClientEncryptionDataKeyProvider } from 'mongodb-client-encryption';
import { isEncrypted } from '../src/plugins/encrypted-field';

export function getAutoEncryptionConfig() {
  const arr = [];
  for (let i = 0; i < 96; ++i) {
    arr.push(i);
  }
  const key = Buffer.from(arr);

  return {
    keyVaultNamespace: 'model-mongoose-test.encryption.datakeys',
    kmsProviders: { local: { key } },
    provider: 'local' as ClientEncryptionDataKeyProvider,
  };
}

// DEBUG=mongoose,ark7:model-mongoose:plugins:encrypted-field npm test --  -g "encrypted-field"
namespace models {
  @A7Model({})
  export class TestEncryptedField1 extends StrictModel {
    otherField?: string;

    @Encrypted({ autoDecrypt: true })
    autoDecryptField?: string;
  }

  @A7Model({})
  export class TestEncryptedField2 extends StrictModel {
    @Encrypted({
      keyAltName: 'anotherDataKey',
      algorithm: EncryptAlgorithm.AEAD_AES_256_CBC_HMAC_SHA_512_RANDOM,
    })
    encryptedFieldWithAnotherKey?: string;

    nestedField?: TestEncryptedField1;

    @Encrypted({ autoDecrypt: true })
    autoDecryptSSN?: SSN;

    @Encrypted({ autoDecrypt: false })
    ssn?: SSN;
  }

  @A7Model({})
  @Mixin(TestEncryptedField2)
  export class TestEncryptedField3 extends MongooseModel {
    normalField?: string;
  }
}

let TestEncryptedField3: any;

describe('encrypted-field', () => {
  before(async () => {
    mongooseManager.set('multiTenancy', {
      enabled: true,
      defaultCollectionNamespace: 'public',
      tenants: [],
      tenancyFn: () => 'default',
      uris: 'mongodb://localhost:27017',
      autoEncryption: getAutoEncryptionConfig(),
    });

    TestEncryptedField3 = mongooseManager.register(models.TestEncryptedField3);

    await TestEncryptedField3.deleteMany({});

    const testMongoose = await new mongoose.Mongoose().connect(
      'mongodb://localhost:27017/model-mongoose-test',
    );

    await testMongoose.connection.dropCollection('encryption.datakeys');

    await mongooseManager
      .getClientEncryption()
      .createDataKey('local', { keyAltNames: ['defaultDataKey'] });

    await mongooseManager
      .getClientEncryption()
      .createDataKey('local', { keyAltNames: ['anotherDataKey'] });
  });

  after(async () => {
    mongooseManager.set('multiTenancy', null);
  });

  it('should calulate encrypted fields', async () => {
    const metadata = A7Model.getMetadata('TestEncryptedField3');
    const encryptedFields = metadata.encryptedFields();

    encryptedFields.should.be.deepEqual([
      {
        name: 'encryptedFieldWithAnotherKey',
        fieldDef: {
          keyAltName: 'anotherDataKey',
          encrypted: true,
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
          autoDecrypt: false,
        },
      },
      {
        name: 'nestedField.autoDecryptField',
        fieldDef: {
          autoDecrypt: true,
          encrypted: true,
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
          keyAltName: 'defaultDataKey',
        },
      },
      {
        name: 'autoDecryptSSN',
        fieldDef: {
          autoDecrypt: true,
          encrypted: true,
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
          keyAltName: 'defaultDataKey',
        },
      },
      {
        name: 'ssn',
        fieldDef: {
          autoDecrypt: false,
          encrypted: true,
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
          keyAltName: 'defaultDataKey',
        },
      },
    ]);
  });

  it('should auto encrypt fields on create & save', async () => {
    const data1RawValue = {
      encryptedFieldWithAnotherKey: 'test-encrypted-field-with-another-key',
      nestedField: {
        otherField: 'test-other-field',
        autoDecryptField: 'test-auto-decrypt-field',
      },
      normalField: 'test-normal-field',
    };

    const data1: any = await TestEncryptedField3.create(data1RawValue);

    // data1 encrypted fields should be encrypted excepts autoDecrypt fields (same as new query from db)
    _.omit(
      data1.toJSON(),
      '_id',
      'encryptedFieldWithAnotherKey',
    ).should.be.deepEqual(
      _.omit(data1RawValue, 'encryptedFieldWithAnotherKey'),
    );

    isEncrypted((data1 as any).encryptedFieldWithAnotherKey).should.be.true();

    // modify and save data1
    data1.normalField = 'updated-normal-field';
    await data1.save();

    _.omit(
      data1.toJSON(),
      '_id',
      'encryptedFieldWithAnotherKey',
    ).should.be.deepEqual(
      _.extend(_.omit(data1RawValue, 'encryptedFieldWithAnotherKey'), {
        normalField: 'updated-normal-field',
      }),
    );

    isEncrypted((data1 as any).encryptedFieldWithAnotherKey).should.be.true();
  });

  it('should auto decrypt fields on find & findOne', async () => {
    await TestEncryptedField3.deleteMany({});

    const data1RawValue = {
      nestedField: {
        otherField: 'test-other-field',
      },
      normalField: 'test-normal-field',
      ssn: '111-11-1111',
      autoDecryptSSN: '222-22-2222',
    };

    const data1: any = await TestEncryptedField3.create(data1RawValue);

    _.omit(data1.toJSON(), '_id', 'ssn').should.be.deepEqual(
      _.omit(data1RawValue, 'ssn'),
    );

    isEncrypted((data1 as any).ssn).should.be.true();

    const result = await TestEncryptedField3.find({
      normalField: 'test-normal-field',
    });

    result.length.should.be.equal(1);
    result[0].toJSON().should.be.deepEqual(data1.toJSON());

    const result2 = await TestEncryptedField3.findOne({
      normalField: 'test-normal-field',
    });

    result2.toJSON().should.be.deepEqual(data1.toJSON());
  });

  it('should auto encrypt & decrypt fields on findOneAndUpdate', async () => {
    await TestEncryptedField3.deleteMany({});

    const data1RawValue = {
      nestedField: {
        otherField: 'test-other-field',
      },
      normalField: 'test-normal-field',
      ssn: '111-11-1111',
      autoDecryptSSN: '222-22-2222',
    };

    await TestEncryptedField3.create(data1RawValue);

    // $set data can be encrypted
    const data1: any = await TestEncryptedField3.findOneAndUpdate(
      {
        normalField: 'test-normal-field',
      },
      {
        $set: {
          ssn: '333-33-3333',
          autoDecryptSSN: '444-44-4444',
        },
      },
      { new: true },
    );

    _.omit(data1.toJSON(), '_id', 'ssn').should.be.deepEqual(
      _.extend(_.omit(data1RawValue, 'ssn'), { autoDecryptSSN: '444-44-4444' }),
    );
    isEncrypted((data1 as any).ssn).should.be.true();

    // $setOnInsert data can be encrypted
    const data2: any = await TestEncryptedField3.findOneAndUpdate(
      {
        normalField: 'test-normal-field2',
      },
      {
        $setOnInsert: {
          ssn: '555-55-5555',
          autoDecryptSSN: '666-66-6666',
        },
      },
      { new: true, upsert: true },
    );

    _.omit(data2.toJSON(), '_id', 'ssn').should.be.deepEqual({
      normalField: 'test-normal-field2',
      autoDecryptSSN: '666-66-6666',
    });

    isEncrypted((data2 as any).ssn).should.be.true();
  });

  it('should auto encrypt & decrypt fields on updateOne & updateMany', async () => {
    await TestEncryptedField3.deleteMany({});

    const data1RawValue = {
      nestedField: {
        otherField: 'test-other-field',
      },
      normalField: 'test-normal-field',
      ssn: '111-11-1111',
      autoDecryptSSN: '222-22-2222',
    };

    await TestEncryptedField3.create(data1RawValue);

    // $set data can be encrypted
    const result1: any = await TestEncryptedField3.updateOne(
      {
        normalField: 'test-normal-field',
      },
      {
        $set: {
          ssn: '333-33-3333',
          autoDecryptSSN: '444-44-4444',
        },
      },
      {},
    );

    result1.modifiedCount.should.be.equal(1);

    const data1 = await TestEncryptedField3.findOne({
      normalField: 'test-normal-field',
    });

    _.omit(data1.toJSON(), '_id', 'ssn').should.be.deepEqual(
      _.extend(_.omit(data1RawValue, 'ssn'), { autoDecryptSSN: '444-44-4444' }),
    );
    isEncrypted((data1 as any).ssn).should.be.true();

    // updateMany data can be encrypted
    const result2: any = await TestEncryptedField3.updateMany(
      {
        normalField: 'test-normal-field',
      },
      {
        $set: {
          ssn: '555-55-5555',
          autoDecryptSSN: '666-66-6666',
        },
      },
      {},
    );

    result2.modifiedCount.should.be.equal(1);

    const data2 = await TestEncryptedField3.findOne({
      normalField: 'test-normal-field',
    });

    _.omit(data2.toJSON(), '_id', 'ssn').should.be.deepEqual({
      nestedField: {
        otherField: 'test-other-field',
      },
      normalField: 'test-normal-field',
      autoDecryptSSN: '666-66-6666',
    });

    isEncrypted((data2 as any).ssn).should.be.true();
  });
});
