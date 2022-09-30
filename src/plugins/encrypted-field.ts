import _ from 'underscore';
import * as mongoose from 'mongoose';
import debug from 'debug';
import { Binary } from 'bson';
import { A7Model, EncryptedFieldOptions } from '@ark7/model';

import { withInheritedProps as dotty } from 'object-path';
import { mongooseManager, MongooseOptions } from '../mongoose-manager';
import { MongooseOptionsPlugin } from '../plugin';
import validator from 'validator';
import { ClientEncryption } from 'mongodb-client-encryption';
import { NamedEncryptedField } from '../mixins/extend';

const d = debug('ark7:model-mongoose:plugins:encrypted-field');

const ENCRIPTED_HEADER = 'ENCR|';

export function isEncrypted(value: string): boolean {
  return (
    value != null &&
    value.startsWith(ENCRIPTED_HEADER) &&
    validator.isBase64(value.substring(ENCRIPTED_HEADER.length))
  );
}

export async function encryptValue(
  encryption: ClientEncryption,
  fieldDef: EncryptedFieldOptions,
  rawValue: string,
): Promise<string> {
  try {
    const encryptedValue = await encryption.encrypt(rawValue, {
      algorithm: fieldDef.algorithm,
      keyAltName: fieldDef.keyAltName,
    });

    return ENCRIPTED_HEADER + encryptedValue.toString('base64');
  } catch (error) {
    console.error('encryptValue error: ', error, ', fieldDef: ', fieldDef);
    return rawValue;
  }
}

export async function decryptValue(
  encryption: ClientEncryption,
  encryptedValue: string,
): Promise<string> {
  if (!isEncrypted(encryptedValue)) {
    return encryptedValue;
  }

  try {
    const binaryEncryptedValue = new Binary(
      Buffer.from(encryptedValue.substring(ENCRIPTED_HEADER.length), 'base64'),
      6,
    );

    return await encryption.decrypt(binaryEncryptedValue);
  } catch (error) {
    console.error('decryptValue error: ', error);
    return encryptedValue;
  }
}

async function autoDecryptFields(
  doc: mongoose.Document,
  encryption: ClientEncryption,
  decryptFields: NamedEncryptedField[],
) {
  await Promise.all(
    _.map(decryptFields, async (field) => {
      const encryptedValue = dotty.get(doc, field.name);
      d('%O is %O', field.name, encryptedValue);

      if (encryptedValue != null && isEncrypted(encryptedValue)) {
        const decryptedValue = await decryptValue(encryption, encryptedValue);
        dotty.set(doc, field.name, decryptedValue);

        d('decrypt %O to %O', field.name, decryptedValue);
      }
    }),
  );
}

async function autoEncryptFields(
  doc: any,
  encryption: ClientEncryption,
  encryptFields: NamedEncryptedField[],
) {
  await Promise.all(
    _.map(encryptFields, async (field) => {
      const rawValue = dotty.get(doc, field.name);

      if (rawValue != null && !isEncrypted(rawValue)) {
        const encryptedValue = await encryptValue(
          encryption,
          field.fieldDef,
          rawValue,
        );

        dotty.set(doc, field.name, encryptedValue);
        d('encrypt %O from %O to %O', field.name, rawValue, encryptedValue);
      }
    }),
  );
}

export const encryptedField: MongooseOptionsPlugin = (
  options: MongooseOptions,
) => {
  if (!(options.mongooseSchema instanceof mongoose.Schema)) {
    return;
  }

  const encryption = mongooseManager.getClientEncryption();
  if (encryption == null) {
    return;
  }

  const metadata = A7Model.getMetadata(options.name);

  const encryptedFields = metadata.encryptedFields();

  if (!_.isEmpty(encryptedFields)) {
    d('Model %O, encryptedFields=%O', options.name, encryptedFields);

    options.mongooseSchema.pre(
      'save',
      async function (this: mongoose.Document, next: () => void) {
        d('pre save: doc=%O', this);

        await autoEncryptFields(this, encryption, encryptedFields);

        d('pre save result: doc=%O', this);

        next();
      },
    );

    options.mongooseSchema.pre(
      'findOneAndUpdate',
      async function (this: mongoose.Query<any, any>, next: () => void) {
        d('pre findOneAndUpdate: query=%O', this);

        const modifiedFields = this.getUpdate();

        if ('$set' in modifiedFields) {
          await autoEncryptFields(
            modifiedFields['$set'],
            encryption,
            encryptedFields,
          );
        }

        if ('$setOnInsert' in modifiedFields) {
          await autoEncryptFields(
            modifiedFields['$setOnInsert'],
            encryption,
            encryptedFields,
          );
        }

        d('pre findOneAndUpdate result: query=%O', this);

        next();
      },
    );

    options.mongooseSchema.pre(
      ['updateOne', 'updateMany'],
      async function (this: mongoose.Query<any, any>, next: () => void) {
        d('pre updateOne: query=%O', this);

        const modifiedFields = this.getUpdate();

        if ('$set' in modifiedFields) {
          await autoEncryptFields(
            modifiedFields['$set'],
            encryption,
            encryptedFields,
          );
        }

        d('pre updateOne result: query=%O', this);

        next();
      },
    );

    // handle autoDecrypt fields
    const decryptFields = _.filter(
      encryptedFields,
      (f) => f.fieldDef.autoDecrypt,
    );

    if (!_.isEmpty(decryptFields)) {
      options.mongooseSchema.post(
        'save',
        async function (doc: mongoose.Document, next: () => void) {
          d('post save: doc=%O', doc);

          await autoDecryptFields(doc, encryption, decryptFields);

          d('post save result: doc=%O', doc);

          next();
        },
      );

      options.mongooseSchema.post(
        ['find', 'findOne'],
        async function (
          docs: mongoose.Document | mongoose.Document[],
          next: () => void,
        ) {
          if (!Array.isArray(docs)) {
            docs = [docs];
          }

          for (const doc of docs) {
            d('post find: doc=%O', doc);

            await autoDecryptFields(doc, encryption, decryptFields);

            d('post find result: doc=%O', doc);
          }

          next();
        },
      );

      options.mongooseSchema.post(
        'findOneAndUpdate',
        async function (doc: mongoose.Document, next: () => void) {
          d('post findOneAndUpdate: query=%O', doc);

          await autoDecryptFields(doc, encryption, decryptFields);

          d('post findOneAndUpdate result: query=%O', doc);

          next();
        },
      );
    }
  }
};
