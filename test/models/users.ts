import { A7Model, Model, Ref } from '@ark7/model';

import { Name } from './names';
import { Post } from './posts';

@A7Model({})
export class User extends Model {
  name: Name;

  posts: Ref<Post>[];
}
