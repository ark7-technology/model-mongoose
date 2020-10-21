import _ from 'underscore';
import { A7Model, StrictModel } from '@ark7/model';

import { Validate } from '../../src';

@A7Model({})
export class Name extends StrictModel {
  @Validate({ maxlength: 5 })
  first: string;

  last: string;

  get fullname(): string {
    return this.first + ' ' + this.last;
  }

  greeting(): string {
    return `Hello, ${this.fullname}`;
  }

  static parse(name: string): Name {
    const parts = name.split(' ');
    return Name.modelize({
      first: _.first(parts),
      last: _.last(parts),
    });
  }
}
