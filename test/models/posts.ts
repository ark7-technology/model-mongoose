import { A7Model, Ref } from '@ark7/model';

import { User } from './users';

@A7Model({})
export class Post {
  topic: string;

  author: Ref<User>;
}
