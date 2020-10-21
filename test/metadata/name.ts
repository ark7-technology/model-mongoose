import { StrictModel } from '@ark7/model';

import { Name } from '../models';

export namespace metadata {
  export const name = {
    configs: {
      schema: {
        name: 'Name',
        props: [
          {
            modifier: 'PUBLIC',
            name: 'first',
            optional: false,
            readonly: false,
            type: 'string',
          },
          {
            modifier: 'PUBLIC',
            name: 'last',
            optional: false,
            readonly: false,
            type: 'string',
          },
          {
            modifier: 'PUBLIC',
            name: 'fullname',
            optional: false,
            readonly: false,
            type: 'string',
          },
          {
            modifier: 'PUBLIC',
            name: 'greeting',
            optional: false,
            readonly: false,
            type: 'method',
          },
        ],
      },
    },
    fields: {
      first: {
        options: {
          maxlength: 5,
        },
        name: 'first',
      },
    },
    modelClass: Name.prototype.constructor,
    name: 'Name',
    superClass: StrictModel.prototype.constructor,
  };
}
