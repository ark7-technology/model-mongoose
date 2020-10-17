import { A7Model, Ref } from '@ark7/model';

import { Name } from './names';
import { Post } from './posts';

@A7Model({})
export class User {
  name: Name;

  posts: Ref<Post>[];
}
