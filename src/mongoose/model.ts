import 'reflect-metadata';
import * as _ from 'underscore';
import {
    DocumentToObjectOptions,
} from 'mongoose';
import { AsObject, AsObjectPartial } from './types';

export interface Model {
    toJSON(options?: DocumentToObjectOptions): AsObject<this>;
}

/**
 * A Model is a class that contains the document schema, methods, and functions.
 */
export class Model {
    // TODO: Define the modelize function, which can convert a POJO to the current
    // model instance.
    public static modelize<T extends new (...args: any[]) => any>(
      this: T,
      _o: AsObjectPartial<InstanceType<T>>,
    ): InstanceType<T> {
        const p = {
            toJSON() {
                return this;
            },
        };
        Object.setPrototypeOf(_o, p);
        Object.setPrototypeOf(p, this.prototype);
        return _o as any;
    }
  }


export function Field(schema: any = {}): PropertyDecorator | any {
    function mapModelSchema(o: any): any {
        if (_.isArray(o)) {
            return _.map(o, (x) => mapModelSchema(x));
        } else if (_.isFunction(o)) {
            if (o.prototype instanceof Model) {
                const func = Object.getOwnPropertyDescriptor(
                    o.__proto__,
                    '$mongooseOptions',
                );
                return func.value.call(o).mongooseSchema;
            } else {
                return o;
            }
        } else if (_.isObject(o) && o.__proto__.constructor.name === 'Object') {
            return _.mapObject(o, (x) => mapModelSchema(x));
        } else {
            return o;
        }
    }
}