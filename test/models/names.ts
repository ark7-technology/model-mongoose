import { A7Model } from '@ark7/model';

import { Validate } from '../../src';

@A7Model({})
export class Name {
  @Validate({
    validator: function (this: Name) {
      return this.first.length >= 3;
    },
    message: (prop) =>
      `${prop.path} must with at least 3 chars, value: ${prop.value}`,
  })
  @Validate({ maxlength: 5 })
  first: string;

  last?: string;

  get fullname(): string {
    return this.first + ' ' + this.last;
  }

  greeting(): string {
    return `Hello, ${this.fullname}`;
  }

  static parse(name: string): Name {
    return null;
  }
}
