import { A7Model } from '@ark7/model';

@A7Model({})
export class Name {
  first: string = 'hello';
  last: string;

  get fullname(): string {
    return this.first + ' ' + this.last;
  }

  greeting(): string {
    return `Hello, ${this.fullname}`;
  }

  static createName(): any {
    return {};
  }
}

@A7Model({})
export class User {
  name: Name;
}
