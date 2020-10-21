import { A7Model, Model, Ref } from '@ark7/model';

import { User } from './users';

@A7Model({})
export class Post extends Model {
  topic: string;

  author: Ref<User>;
}
